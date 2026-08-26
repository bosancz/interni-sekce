import {
	Controller,
	Get,
	InternalServerErrorException,
	Logger,
	NotFoundException,
	Param,
	ParseIntPipe,
	Query,
	Req,
	Res,
} from "@nestjs/common";
import { ApiProduces, ApiResponse, ApiTags } from "@nestjs/swagger";
import archiver = require("archiver");
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
	PublicProgramIcalPermission,
	PublicProgramPermission,
} from "../acl/public.acl";
import { PublicGalleryQuery, PublicProgramQuery } from "../dto/public.dto";
import { ProgramIcalService } from "../services/program-ical.service";
import { PublicService } from "../services/public.service";
import { contentDispositionFilename } from "src/helpers/sanitizefilename";

@Controller("public")
@AcController()
@ApiTags("Public API")
export class PublicController {
	private readonly logger = new Logger(PublicController.name);

	constructor(
		private readonly publicService: PublicService,
		private readonly programIcal: ProgramIcalService,
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

	@Get("program/ical")
	@AcLinks(PublicProgramIcalPermission)
	@ApiProduces("text/calendar")
	@ApiResponse({ status: 200, description: "iCalendar feed of the public program.", type: String })
	async getProgramIcal(@Res() res: Response): Promise<void> {
		await this.programIcal.sendProgramIcal(res);
	}

	@Get("program/:id/registration")
	async getProgramRegistration(@Param("id", ParseIntPipe) id: number, @Res() res: Response): Promise<void> {
		const { path, filename } = await this.publicService.getRegistrationFile(id);

		res.setHeader("Content-Type", "application/pdf");
		res.setHeader("Content-Disposition", `attachment; ${contentDispositionFilename(filename)}`);

		await new Promise<void>((resolve, reject) => {
			res.sendFile(path, (err) => (err ? reject(new InternalServerErrorException(err.message)) : resolve()));
		});
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
	async getGalleryAlbum(@Param("id", ParseIntPipe) id: number) {
		return this.publicService.getAlbum(id);
	}

	@Get("gallery/:id/preview")
	@AcLinks(PublicGalleryAlbumPreviewPermission)
	async getGalleryAlbumPreview(@Param("id", ParseIntPipe) id: number) {
		return this.publicService.getAlbum(id, { preview: true });
	}

	@Get("gallery/:id/download")
	async downloadAlbum(@Param("id", ParseIntPipe) id: number, @Res() res: Response): Promise<void> {
		const { filename, files } = await this.publicService.getAlbumDownload(id);

		const archive = archiver("zip", { store: true });

		archive.on("warning", (err) => this.logger.warn(`Album ${id} ZIP warning: ${err.message}`));
		archive.on("error", (err) => {
			this.logger.error(`Album ${id} ZIP failed: ${err.message}`);
			res.destroy(err);
		});

		res.setHeader("Content-Type", "application/zip");
		res.setHeader("Content-Disposition", `attachment; ${contentDispositionFilename(filename)}`);

		archive.pipe(res);
		for (const file of files) archive.file(file.path, { name: file.name });

		await archive.finalize();
	}

	@Get("photos/:id/image/:size")
	async getPublicPhotoImage(
		@Param("id", ParseIntPipe) id: number,
		@Param("size") size: PhotoSizes,
		@Res() res: Response,
	): Promise<void> {
		if (!Object.values(PhotoSizes).includes(size)) throw new NotFoundException("Unknown image size.");

		const photo = await this.photos.getPhoto(id);
		if (!photo) throw new NotFoundException();

		const album = await this.albums.getAlbum(photo.albumId);
		if (!album || album.status !== AlbumStatus.public) throw new NotFoundException();

		const ext = extname(photo.name);
		const path = this.photosFiles.getPhotoImagePath(photo, size);

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
