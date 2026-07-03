import {
	Controller,
	Get,
	NotFoundException,
	NotImplementedException,
	Param,
	Query,
	Req,
	Res,
} from "@nestjs/common";
import { ApiExcludeController } from "@nestjs/swagger";
import { Request, Response } from "express";
import { createReadStream } from "fs";
import { contentType } from "mime-types";
import { extname } from "path";
import { AcController, AcLinks } from "src/access-control/access-control-lib";
import { PhotoSizes } from "src/api/albums/dto/photo.dto";
import { AlbumStatus } from "src/models/albums/entities/album.entity";
import { AlbumsRepository } from "src/models/albums/repositories/albums.repository";
import { PhotosRepository } from "src/models/albums/repositories/photos.repository";
import { PhotosFilesService } from "src/models/albums/services/photos-files.service";
import {
	PublicGalleryAlbumPermission,
	PublicGalleryAlbumPreviewPermission,
	PublicGalleryPermission,
	PublicGalleryRecentPermission,
	PublicProgramPermission,
} from "../acl/public.acl";
import { PublicGalleryQuery, PublicProgramQuery } from "../dto/public.dto";
import { PublicService } from "../services/public.service";

/**
 * Unauthenticated public API consumed by the bosan.cz website. Returns the legacy
 * response shapes (string `_id`s, photo `sizes`, `_links`) so the existing website
 * frontend keeps working against the rewritten backend without changes on its side.
 *
 * Excluded from the internal OpenAPI docs — it is a stable external contract, not
 * part of the HATEOAS/AC-lib surface the internal SDK is generated from.
 */
@Controller("public")
@AcController()
@ApiExcludeController()
export class PublicController {
	constructor(
		private readonly publicService: PublicService,
		private readonly albums: AlbumsRepository,
		private readonly photos: PhotosRepository,
		private readonly photosFiles: PhotosFilesService,
	) {}

	@Get("program")
	@AcLinks(PublicProgramPermission)
	async getProgram(@Req() req: Request, @Query() query: PublicProgramQuery) {
		return this.publicService.getProgram({
			limit: query.limit,
			dateFrom: query.dateFrom,
			dateTill: query.dateTill,
		});
	}

	@Get("program/:id/registration")
	async getProgramRegistration() {
		// The internal registration PDF lives behind auth; a dedicated public download can be
		// wired here once the storage location for public registrations is confirmed.
		throw new NotImplementedException("Public registration download is not available yet.");
	}

	@Get("gallery")
	@AcLinks(PublicGalleryPermission)
	async getGallery(@Req() req: Request, @Query() query: PublicGalleryQuery) {
		return this.publicService.getGallery();
	}

	@Get("gallery/recent")
	@AcLinks(PublicGalleryRecentPermission)
	async getGalleryRecent(@Req() req: Request, @Query() query: PublicGalleryQuery) {
		return this.publicService.getRecentGallery(query.limit);
	}

	@Get("gallery/:id")
	@AcLinks(PublicGalleryAlbumPermission)
	async getGalleryAlbum(@Param("id") id: number) {
		return this.publicService.getAlbum(id);
	}

	@Get("gallery/:id/preview")
	@AcLinks(PublicGalleryAlbumPreviewPermission)
	async getGalleryAlbumPreview(@Param("id") id: number) {
		return this.publicService.getAlbum(id, { preview: true });
	}

	@Get("gallery/:id/download")
	async downloadAlbum() {
		// bosan.cz always renders the album download link, so the route must exist; ZIP
		// streaming needs an archiver dependency which is a follow-up decision.
		throw new NotImplementedException("Album ZIP download is not available yet.");
	}

	@Get("photos/:id/image/:size")
	async getPhotoImage(@Param("id") id: number, @Param("size") size: PhotoSizes, @Res() res: Response): Promise<void> {
		if (!Object.values(PhotoSizes).includes(size)) throw new NotFoundException("Unknown image size.");

		const photo = await this.photos.getPhoto(id);
		if (!photo) throw new NotFoundException();

		// only expose photos that belong to a published album
		const album = await this.albums.getAlbum(photo.albumId);
		if (!album || album.status !== AlbumStatus.public) throw new NotFoundException();

		const ext = extname(photo.name);
		const path = this.photosFiles.getImagePath(photo.albumId, photo.id, size, ext);

		try {
			await this.photosFiles.fileExists(path);
		} catch {
			throw new NotFoundException("Image file not found.");
		}

		res.setHeader("Content-Type", contentType(ext) || "application/octet-stream");
		res.setHeader("Cache-Control", "public, max-age=86400");
		createReadStream(path).pipe(res);
	}
}
