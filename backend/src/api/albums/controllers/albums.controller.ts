import { Body, Controller, Delete, Get, NotFoundException, Param, Patch, Post, Query, Req } from "@nestjs/common";
import { ApiResponse, ApiTags } from "@nestjs/swagger";
import { Request } from "express";
import { AcController, AcLinks, WithLinks } from "src/access-control/access-control-lib";
import { AlbumStatus } from "src/models/albums/entities/album.entity";
import { AlbumsRepository, GetAlbumsOptions } from "src/models/albums/repositories/albums.repository";
import { PhotosRepository } from "src/models/albums/repositories/photos.repository";
import {
	AlbumCreateRoute,
	AlbumDeleteRoute,
	AlbumEditRoute,
	AlbumPhotosRoute,
	AlbumPublishRoute,
	AlbumReadRoute,
	AlbumUnpublishRoute,
	AlbumsListRoute,
	AlbumsYearsRoute,
} from "../acl/albums.acl";
import { AlbumCreateBody, AlbumListQuery, AlbumResponse, AlbumUpdateBody } from "../dto/album.dto";
import { PhotoResponse } from "../dto/photo.dto";

@Controller("albums")
@AcController()
@ApiTags("Photo gallery")
export class AlbumsController {
	constructor(
		private albums: AlbumsRepository,
		private photos: PhotosRepository,
	) {}

	@Get()
	@AcLinks(AlbumsListRoute)
	@ApiResponse({ status: 200, type: WithLinks(AlbumResponse), isArray: true })
	async listAlbums(@Req() req: Request, @Query() query: AlbumListQuery): Promise<AlbumResponse[]> {
		const options: GetAlbumsOptions = {
			limit: query.limit,
			offset: query.offset,
			year: query.year ? parseInt(query.year) : undefined,
			status: query.status,
			search: query.search,
		};

		return this.albums.getAlbums(options);
	}

	@Post()
	@AcLinks(AlbumCreateRoute)
	@ApiResponse({ status: 200, type: WithLinks(AlbumResponse) })
	async createAlbum(@Req() req: Request, @Body() body: AlbumCreateBody): Promise<AlbumResponse> {
		AlbumCreateRoute.canOrThrow(req);

		return this.albums.createAlbum(body);
	}

	@Get("years")
	@AcLinks(AlbumsYearsRoute)
	@ApiResponse({ status: 200, schema: { type: "array", items: { type: "number" } } })
	async getAlbumsYears(@Req() req: Request): Promise<number[]> {
		AlbumsYearsRoute.canOrThrow(req);

		return this.albums.getAlbumsYears();
	}

	@Get(":id")
	@AcLinks(AlbumReadRoute)
	@ApiResponse({ status: 200, type: WithLinks(AlbumResponse) })
	async getAlbum(@Param("id") id: number, @Req() req: Request): Promise<AlbumResponse> {
		const album = await this.albums.getAlbum(id);
		if (!album) throw new NotFoundException();

		AlbumReadRoute.canOrThrow(req, album);

		return album;
	}

	@Patch(":id")
	@AcLinks(AlbumEditRoute)
	@ApiResponse({ status: 204 })
	async updateAlbum(@Param("id") id: number, @Req() req: Request, @Body() body: AlbumUpdateBody): Promise<void> {
		const album = await this.albums.getAlbum(id);
		if (!album) throw new NotFoundException();

		AlbumEditRoute.canOrThrow(req, album);

		await this.albums.updateAlbum(album.id, body);
	}

	@Delete(":id")
	@AcLinks(AlbumDeleteRoute)
	@ApiResponse({ status: 204 })
	async deleteAlbum(@Param("id") id: number, @Req() req: Request): Promise<void> {
		const album = await this.albums.getAlbum(id);
		if (!album) throw new NotFoundException();

		AlbumDeleteRoute.canOrThrow(req, album);

		await this.albums.deleteAlbum(id);
	}

	@Post(":id/publish")
	@AcLinks(AlbumPublishRoute)
	@ApiResponse({ status: 204 })
	async publishAlbum(@Param("id") id: number, @Req() req: Request): Promise<void> {
		const album = await this.albums.getAlbum(id);
		if (!album) throw new NotFoundException();

		AlbumPublishRoute.canOrThrow(req, album);

		await this.albums.updateAlbum(id, { status: AlbumStatus.public });
	}

	@Post(":id/unpublish")
	@AcLinks(AlbumUnpublishRoute)
	@ApiResponse({ status: 204 })
	async unpublishAlbum(@Param("id") id: number, @Req() req: Request): Promise<void> {
		const album = await this.albums.getAlbum(id);
		if (!album) throw new NotFoundException();

		AlbumUnpublishRoute.canOrThrow(req, album);

		await this.albums.updateAlbum(id, { status: AlbumStatus.draft });
	}

	@Get(":id/photos")
	@AcLinks(AlbumPhotosRoute)
	@ApiResponse({ status: 200, type: WithLinks(PhotoResponse), isArray: true })
	async getAlbumPhotos(@Param("id") id: number, @Req() req: Request): Promise<PhotoResponse[]> {
		return this.photos.getPhotos({ album: id });
	}
}
