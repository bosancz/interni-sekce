import {
	Body,
	Controller,
	Delete,
	Get,
	NotFoundException,
	Param,
	ParseIntPipe,
	Patch,
	Post,
	Query,
	Req,
} from "@nestjs/common";
import { ApiResponse, ApiTags } from "@nestjs/swagger";
import { Request } from "express";
import { DateTime } from "luxon";
import { AcController, AcLinks, WithLinks } from "src/access-control/access-control-lib";
import { Authenticated } from "src/auth/decorators/authenticated.decorator";
import { AlbumStatus } from "src/models/albums/entities/album.entity";
import { AlbumsRepository, GetAlbumsOptions } from "src/models/albums/repositories/albums.repository";
import { PhotosRepository } from "src/models/albums/repositories/photos.repository";
import {
	AlbumCreatePermission,
	AlbumDeletePermanentPermission,
	AlbumDeletePermission,
	AlbumEditPermission,
	AlbumPhotosPermission,
	AlbumPublishPermission,
	AlbumReadPermission,
	AlbumReorderPhotosPermission,
	AlbumRestorePermission,
	AlbumSetTitlePhotoPermission,
	AlbumsDeletedListPermission,
	AlbumsListPermission,
	AlbumsYearsPermission,
	AlbumUnpublishPermission,
} from "../acl/albums.acl";
import { AlbumCreateBody, AlbumListQuery, AlbumResponse, AlbumUpdateBody } from "../dto/album.dto";
import { AlbumPhotosOrderBody, AlbumTitlePhotoBody, PhotoResponse } from "../dto/photo.dto";

@Controller("albums")
@Authenticated()
@AcController()
@ApiTags("Photo gallery")
export class AlbumsController {
	constructor(
		private albums: AlbumsRepository,
		private photos: PhotosRepository,
	) {}

	@Get()
	@AcLinks(AlbumsListPermission)
	@ApiResponse({ status: 200, type: WithLinks(AlbumResponse), isArray: true })
	async listAlbums(@Req() req: Request, @Query() query: AlbumListQuery): Promise<AlbumResponse[]> {
		const where = AlbumsListPermission.canWhere(req, "albums");

		const options: GetAlbumsOptions = {
			limit: query.limit,
			offset: query.offset,
			year: query.year,
			status: query.status,
			search: query.search,
			sort: query.sort,
			order: query.order,
		};

		const albums = await this.albums.getAlbums(options, where);
		const coverPhotoByAlbum = await this.photos.getCoverPhotosByAlbums(albums.map((album) => album.id));

		return albums.map((album) => ({ ...album, coverPhoto: coverPhotoByAlbum.get(album.id) }));
	}

	@Post()
	@AcLinks(AlbumCreatePermission)
	@ApiResponse({ status: 200, type: WithLinks(AlbumResponse) })
	async createAlbum(@Req() req: Request, @Body() body: AlbumCreateBody): Promise<AlbumResponse> {
		AlbumCreatePermission.canOrThrow(req);

		return this.albums.createAlbum({ ...body, createdById: req.user?.userId ?? null });
	}

	@Get("deleted")
	@AcLinks(AlbumsDeletedListPermission)
	@ApiResponse({ status: 200, type: WithLinks(AlbumResponse), isArray: true })
	async listDeletedAlbums(@Req() req: Request): Promise<AlbumResponse[]> {
		AlbumsDeletedListPermission.canOrThrow(req);

		const where = AlbumsDeletedListPermission.canWhere(req, "albums");

		return this.albums.getDeletedAlbums(where);
	}

	@Get("years")
	@AcLinks(AlbumsYearsPermission)
	@ApiResponse({ status: 200, schema: { type: "array", items: { type: "number" } } })
	async getAlbumsYears(@Req() req: Request): Promise<number[]> {
		AlbumsYearsPermission.canOrThrow(req);

		return this.albums.getAlbumsYears();
	}

	@Get(":albumId")
	@AcLinks(AlbumReadPermission)
	@ApiResponse({ status: 200, type: WithLinks(AlbumResponse) })
	async getAlbum(@Param("albumId", ParseIntPipe) albumId: number, @Req() req: Request): Promise<AlbumResponse> {
		const album = await this.albums.getAlbum(albumId, { event: true });
		if (!album) throw new NotFoundException();

		AlbumReadPermission.canOrThrow(req, album);

		return album;
	}

	@Patch(":albumId")
	@AcLinks(AlbumEditPermission)
	@ApiResponse({ status: 204 })
	async updateAlbum(
		@Param("albumId", ParseIntPipe) albumId: number,
		@Req() req: Request,
		@Body() body: AlbumUpdateBody,
	): Promise<void> {
		const album = await this.albums.getAlbum(albumId);
		if (!album) throw new NotFoundException();

		AlbumEditPermission.canOrThrow(req, album);

		await this.albums.updateAlbum(album.id, body);
	}

	@Delete(":albumId")
	@AcLinks(AlbumDeletePermission)
	@ApiResponse({ status: 204 })
	async deleteAlbum(@Param("albumId", ParseIntPipe) albumId: number, @Req() req: Request): Promise<void> {
		const album = await this.albums.getAlbum(albumId);
		if (!album) throw new NotFoundException();

		AlbumDeletePermission.canOrThrow(req, album);

		await this.albums.deleteAlbum(albumId);
	}

	@Post(":albumId/restore")
	@AcLinks(AlbumRestorePermission)
	@ApiResponse({ status: 204 })
	async restoreAlbum(@Param("albumId", ParseIntPipe) albumId: number, @Req() req: Request): Promise<void> {
		const album = await this.albums.getDeletedAlbum(albumId);
		if (!album) throw new NotFoundException();

		AlbumRestorePermission.canOrThrow(req, album);

		await this.albums.restoreAlbum(albumId);
	}

	@Delete(":albumId/permanent")
	@AcLinks(AlbumDeletePermanentPermission)
	@ApiResponse({ status: 204 })
	async deleteAlbumPermanent(@Param("albumId", ParseIntPipe) albumId: number, @Req() req: Request): Promise<void> {
		const album = await this.albums.getDeletedAlbum(albumId);
		if (!album) throw new NotFoundException();

		AlbumDeletePermanentPermission.canOrThrow(req, album);

		await this.albums.hardDeleteAlbum(albumId);
	}

	@Post(":albumId/publish")
	@AcLinks(AlbumPublishPermission)
	@ApiResponse({ status: 204 })
	async publishAlbum(@Param("albumId", ParseIntPipe) albumId: number, @Req() req: Request): Promise<void> {
		const album = await this.albums.getAlbum(albumId);
		if (!album) throw new NotFoundException();

		AlbumPublishPermission.canOrThrow(req, album);

		await this.albums.updateAlbum(albumId, { status: AlbumStatus.public, datePublished: DateTime.local().toISO() });
	}

	@Post(":albumId/unpublish")
	@AcLinks(AlbumUnpublishPermission)
	@ApiResponse({ status: 204 })
	async unpublishAlbum(@Param("albumId", ParseIntPipe) albumId: number, @Req() req: Request): Promise<void> {
		const album = await this.albums.getAlbum(albumId);
		if (!album) throw new NotFoundException();

		AlbumUnpublishPermission.canOrThrow(req, album);

		await this.albums.updateAlbum(albumId, { status: AlbumStatus.draft, datePublished: null });
	}

	@Get(":albumId/photos")
	@AcLinks(AlbumPhotosPermission)
	@ApiResponse({ status: 200, type: WithLinks(PhotoResponse), isArray: true })
	async getAlbumPhotos(
		@Param("albumId", ParseIntPipe) albumId: number,
		@Req() req: Request,
	): Promise<PhotoResponse[]> {
		const album = await this.albums.getAlbum(albumId);
		if (!album) throw new NotFoundException();

		AlbumPhotosPermission.canOrThrow(req, album);

		return this.photos.getPhotos({ album: albumId });
	}

	@Patch(":albumId/photos/order")
	@AcLinks(AlbumReorderPhotosPermission)
	@ApiResponse({ status: 204 })
	async reorderAlbumPhotos(
		@Param("albumId", ParseIntPipe) albumId: number,
		@Req() req: Request,
		@Body() body: AlbumPhotosOrderBody,
	): Promise<void> {
		const album = await this.albums.getAlbum(albumId);
		if (!album) throw new NotFoundException();

		AlbumReorderPhotosPermission.canOrThrow(req, album);

		await this.photos.reorderPhotos(album.id, body.photoIds);
	}

	@Patch(":id/photos/title")
	@AcLinks(AlbumSetTitlePhotoPermission)
	@ApiResponse({ status: 204 })
	async setAlbumTitlePhoto(
		@Param("id", ParseIntPipe) id: number,
		@Req() req: Request,
		@Body() body: AlbumTitlePhotoBody,
	): Promise<void> {
		const album = await this.albums.getAlbum(id);
		if (!album) throw new NotFoundException();

		AlbumSetTitlePhotoPermission.canOrThrow(req, album);

		await this.photos.setTitlePhoto(album.id, body.photoId);
	}
}
