import {
	BadRequestException,
	Logger,
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
	Put,
	Res,
	UnprocessableEntityException,
	UploadedFile,
	UseInterceptors,
} from "@nestjs/common";
import { FileInterceptor } from "@nestjs/platform-express";
import { ApiBody, ApiConsumes, ApiProduces, ApiResponse, ApiTags } from "@nestjs/swagger";
import { Request, Response } from "express";
import { readFile, unlink } from "fs/promises";
import { DateTime } from "luxon";
import { Config, StaticConfig } from "src/config";
import { contentDispositionFilename } from "src/helpers/sanitizefilename";
import { getAlbumChroniclePath } from "src/models/albums/helpers/album-chronicle";
import { FilesService } from "src/models/files/services/files.service";
import { AcController, AcLinks, WithLinks } from "src/access-control/access-control-lib";
import { Authenticated } from "src/auth/decorators/authenticated.decorator";
import { AlbumStatus } from "src/models/albums/entities/album.entity";
import { AlbumsRepository, GetAlbumsOptions } from "src/models/albums/repositories/albums.repository";
import { PhotosRepository } from "src/models/albums/repositories/photos.repository";
import { PhotosFilesService } from "src/models/albums/services/photos-files.service";
import { NotificationsService } from "src/models/notifications/services/notifications.service";
import {
	AlbumChronicleDeletePermission,
	AlbumChronicleReadPermission,
	AlbumChronicleUploadPermission,
	AlbumCreatePermission,
	AlbumDeletePermanentPermission,
	AlbumDeletePermission,
	AlbumDownloadPermission,
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
	private logger = new Logger(AlbumsController.name);

	constructor(
		private albums: AlbumsRepository,
		private photos: PhotosRepository,
		private photosFiles: PhotosFilesService,
		private notificationsService: NotificationsService,
		private fileService: FilesService,
		private config: Config,
	) {}

	private chroniclePath(album: { id: number }): string {
		return getAlbumChroniclePath(this.config.fs.albumsDir, album);
	}

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
		const album = await this.albums.getAlbumDetail(albumId);
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
		if (album.chronicleFileName)
			await this.fileService.deleteFile(this.chroniclePath(album)).catch(() => undefined);
	}

	@Post(":albumId/publish")
	@AcLinks(AlbumPublishPermission)
	@ApiResponse({ status: 204 })
	async publishAlbum(@Param("albumId", ParseIntPipe) albumId: number, @Req() req: Request): Promise<void> {
		const album = await this.albums.getAlbum(albumId);
		if (!album) throw new NotFoundException();

		AlbumPublishPermission.canOrThrow(req, album);

		await this.albums.updateAlbum(albumId, { status: AlbumStatus.public, datePublished: DateTime.local().toISO() });

		this.notificationsService
			.onAlbumPublished(album, req.user?.userId)
			.catch((err) => this.logger.error(`Failed to send album published notifications: ${err.message}`));
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

	@Get(":albumId/chronicle")
	@AcLinks(AlbumChronicleReadPermission)
	@ApiProduces("application/pdf")
	async getAlbumChronicle(
		@Param("albumId", ParseIntPipe) albumId: number,
		@Req() req: Request,
		@Res() res: Response,
	): Promise<void> {
		const album = await this.albums.getAlbum(albumId);
		if (!album) throw new NotFoundException();

		AlbumChronicleReadPermission.canOrThrow(req, album);

		res.setHeader("Content-Type", "application/pdf");
		res.setHeader("Content-Disposition", `inline; ${contentDispositionFilename(album.chronicleFileName!)}`);

		await new Promise<void>((resolve, reject) => {
			res.sendFile(this.chroniclePath(album), (err) =>
				err ? reject(new NotFoundException("Chronicle file not found.")) : resolve(),
			);
		});
	}

	@Put(":albumId/chronicle")
	@AcLinks(AlbumChronicleUploadPermission)
	@ApiResponse({ status: 204 })
	@UseInterceptors(
		FileInterceptor("file", {
			dest: "./uploads_temp",
			limits: { fileSize: StaticConfig.chronicles.maxUploadSize },
		}),
	)
	@ApiConsumes("multipart/form-data")
	@ApiBody({ schema: { type: "object", properties: { file: { type: "string", format: "binary" } } } })
	async uploadAlbumChronicle(
		@Param("albumId", ParseIntPipe) albumId: number,
		@Req() req: Request,
		@UploadedFile() file: Express.Multer.File,
	): Promise<void> {
		if (!file) throw new BadRequestException("File not provided.");

		let data: Buffer;
		try {
			data = await readFile(file.path);
		} finally {
			await unlink(file.path).catch(() => undefined);
		}

		const album = await this.albums.getAlbum(albumId);
		if (!album) throw new NotFoundException();

		AlbumChronicleUploadPermission.canOrThrow(req, album);

		if (data.subarray(0, 5).toString("latin1") !== "%PDF-") {
			throw new UnprocessableEntityException("Chronicle must be a PDF file.");
		}

		const originalName = Buffer.from(file.originalname, "latin1").toString("utf8");
		const fileName = /\.pdf$/i.test(originalName) ? originalName : `${originalName}.pdf`;

		await this.fileService.saveFile(this.chroniclePath(album), data);
		await this.albums.updateAlbum(album.id, {
			chronicleFileName: fileName,
			chronicleSize: data.length,
			chronicleUpdatedAt: new Date(),
		});
	}

	@Delete(":albumId/chronicle")
	@AcLinks(AlbumChronicleDeletePermission)
	@ApiResponse({ status: 204 })
	async deleteAlbumChronicle(@Param("albumId", ParseIntPipe) albumId: number, @Req() req: Request): Promise<void> {
		const album = await this.albums.getAlbum(albumId);
		if (!album) throw new NotFoundException();

		AlbumChronicleDeletePermission.canOrThrow(req, album);

		await this.fileService.deleteFile(this.chroniclePath(album)).catch(() => undefined);
		await this.albums.updateAlbum(album.id, {
			chronicleFileName: null,
			chronicleSize: null,
			chronicleUpdatedAt: null,
		});
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

		return this.photos.getPhotos({ album: albumId, uploadedBy: true });
	}

	@Get(":albumId/download")
	@AcLinks(AlbumDownloadPermission)
	@ApiProduces("application/zip")
	async downloadAlbumPhotos(
		@Param("albumId", ParseIntPipe) albumId: number,
		@Req() req: Request,
		@Res() res: Response,
	): Promise<void> {
		const album = await this.albums.getAlbum(albumId);
		if (!album) throw new NotFoundException();

		AlbumDownloadPermission.canOrThrow(req, album);

		const photos = await this.photos.getPhotos({ album: albumId });
		if (!photos.length) throw new NotFoundException("Album has no downloadable photos.");

		await this.photosFiles.sendAlbumArchive(res, album, photos);
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
