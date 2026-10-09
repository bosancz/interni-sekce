import {
	BadRequestException,
	Body,
	Controller,
	Delete,
	GatewayTimeoutException,
	Get,
	Logger,
	NotFoundException,
	Param,
	ParseIntPipe,
	Patch,
	Post,
	Query,
	Req,
	Res,
	UploadedFile,
	UseInterceptors,
} from "@nestjs/common";
import { FileInterceptor } from "@nestjs/platform-express";
import { ApiBody, ApiConsumes, ApiResponse, ApiTags } from "@nestjs/swagger";
import { Request, Response } from "express";
import { createReadStream } from "fs";
import { contentType } from "mime-types";
import { extname } from "path";
import { AcController, AcLinks, WithLinks } from "src/access-control/access-control-lib";
import { Authenticated } from "src/auth/decorators/authenticated.decorator";
import { PhotoCategoriesService } from "src/models/albums/services/photo-categories.service";
import { PhotosFilesService } from "src/models/albums/services/photos-files.service";
import { PhotosRepository } from "src/models/albums/repositories/photos.repository";
import { FacesDetectionService } from "src/models/worker/services/faces-detection.service";
import { PhotoContentService } from "src/models/worker/services/photo-content.service";
import {
	PhotoCreatePermission,
	PhotoDailyPermission,
	PhotoDeletePermission,
	PhotoEditPermission,
	PhotoReadFilePermission,
	PhotoCategoriesOfPhotoPermission,
	PhotoReadPermission,
	PhotosBrowsePermission,
	PhotosListPermission,
} from "../acl/photo.acl";
import {
	PhotoBrowseQuery,
	PhotoCategoryOfPhotoResponse,
	PhotoCreateBody,
	PhotoDailyResponse,
	PhotoResponse,
	PhotoSizes,
	PhotoUpdateBody,
} from "../dto/photo.dto";

const BROWSE_LIMIT = 60;

@Controller("photos")
@Authenticated()
@AcController()
@ApiTags("Photo gallery")
export class PhotosController {
	private logger = new Logger(PhotosController.name);

	constructor(
		private photos: PhotosRepository,
		private photosFiles: PhotosFilesService,
		private photoCategoriesService: PhotoCategoriesService,
		private facesDetectionService: FacesDetectionService,
		private photoContentService: PhotoContentService,
	) {}

	@Get()
	@AcLinks(PhotosListPermission)
	@ApiResponse({ status: 200, type: WithLinks(PhotoResponse), isArray: true })
	async listPhotos(@Req() req: Request) {
		const where = PhotosListPermission.canWhere(req, "photos");

		return this.photos.getPhotos({}, where);
	}

	@Post()
	@AcLinks(PhotoCreatePermission)
	@UseInterceptors(FileInterceptor("file"))
	@ApiConsumes("multipart/form-data")
	@ApiBody({ type: PhotoCreateBody })
	@ApiResponse({ status: 201, type: WithLinks(PhotoResponse) })
	async createPhoto(
		@Req() req: Request,
		@UploadedFile() file: Express.Multer.File,
		@Body() body: PhotoCreateBody,
	): Promise<PhotoResponse> {
		PhotoCreatePermission.canOrThrow(req);

		if (!file) throw new BadRequestException("Missing file.");

		const ext = extname(file.originalname).slice(1).toLowerCase();
		if (!this.photosFiles.isAllowedType(ext)) throw new BadRequestException("Unsupported file type.");

		const photo = await this.photos.createPhoto(body.albumId, file, req.user?.userId ?? null);

		this.facesDetectionService
			.enqueuePhotos([photo])
			.catch((err) => this.logger.error(`Failed to queue photo ${photo.id} for face detection.`, err));
		this.photoContentService
			.enqueuePhotos([photo])
			.catch((err) => this.logger.error(`Failed to queue photo ${photo.id} for content recognition.`, err));

		return photo;
	}

	@Get("browse")
	@AcLinks(PhotosBrowsePermission)
	@ApiResponse({ status: 200, type: WithLinks(PhotoResponse), isArray: true })
	async browsePhotos(@Req() req: Request, @Query() query: PhotoBrowseQuery): Promise<PhotoResponse[]> {
		PhotosBrowsePermission.canOrThrow(req);

		const categories = query.categoryIds?.length
			? await this.photoCategoriesService.getCategoryQueries(query.categoryIds)
			: [];
		if (categories.some((category) => category === null)) return [];

		const text = query.q?.trim();
		let embedding: number[] | undefined;
		if (text) {
			try {
				embedding = await this.photoContentService.embedText(text);
			} catch (err) {
				this.logger.warn(`Text embedding failed: ${err}`);
				throw new GatewayTimeoutException("Worker did not answer, is any worker running the embed-text task?");
			}
		}

		return this.photos.browsePhotos({
			query: embedding,
			dateFrom: query.dateFrom,
			dateTill: query.dateTill,
			categories: categories.filter((category) => category !== null),
			memberIds: query.memberIds,
			limit: query.limit ?? BROWSE_LIMIT,
			offset: query.offset ?? 0,
		});
	}

	@Get("daily")
	@AcLinks(PhotoDailyPermission)
	@ApiResponse({ status: 200, type: PhotoDailyResponse })
	async getDailyPhoto(@Req() req: Request): Promise<PhotoDailyResponse> {
		PhotoDailyPermission.canOrThrow(req);

		return this.photos.getDailyPhoto();
	}

	@Get(":photoId")
	@AcLinks(PhotoReadPermission)
	@ApiResponse({ status: 200, type: WithLinks(PhotoResponse) })
	async getPhoto(@Param("photoId", ParseIntPipe) photoId: number, @Req() req: Request) {
		const photo = await this.photos.getPhoto(photoId);
		if (!photo) throw new NotFoundException();

		PhotoReadPermission.canOrThrow(req, photo);

		return photo;
	}

	@Get(":photoId/categories")
	@AcLinks(PhotoCategoriesOfPhotoPermission)
	@ApiResponse({ status: 200, type: PhotoCategoryOfPhotoResponse, isArray: true })
	async listPhotoCategoriesOfPhoto(
		@Param("photoId", ParseIntPipe) photoId: number,
		@Req() req: Request,
	): Promise<PhotoCategoryOfPhotoResponse[]> {
		const photo = await this.photos.getPhoto(photoId);
		if (!photo) throw new NotFoundException();

		PhotoCategoriesOfPhotoPermission.canOrThrow(req, photo);

		const categories = await this.photoCategoriesService.getPhotoCategories(photoId);

		return categories.map(({ category, score }) => ({ categoryId: category.id, name: category.name, score }));
	}

	@Patch(":photoId")
	@AcLinks(PhotoEditPermission)
	@ApiResponse({ status: 204 })
	async updatePhoto(
		@Param("photoId", ParseIntPipe) photoId: number,
		@Req() req: Request,
		@Body() body: PhotoUpdateBody,
	): Promise<void> {
		const photo = await this.photos.getPhoto(photoId);
		if (!photo) throw new NotFoundException();

		PhotoEditPermission.canOrThrow(req, photo);

		await this.photos.updatePhoto(photo.id, body);
	}

	@Delete(":photoId")
	@AcLinks(PhotoDeletePermission)
	@ApiResponse({ status: 204 })
	async deletePhoto(@Param("photoId", ParseIntPipe) photoId: number, @Req() req: Request): Promise<void> {
		const photo = await this.photos.getPhoto(photoId);
		if (!photo) throw new NotFoundException();

		PhotoDeletePermission.canOrThrow(req, photo);

		await this.photos.deletePhoto(photo.id);
	}

	@Get(":photoId/image/:size")
	@AcLinks(PhotoReadFilePermission)
	async getPhotoImage(
		@Param("photoId", ParseIntPipe) photoId: number,
		@Param("size") size: PhotoSizes,
		@Req() req: Request,
		@Res() res: Response,
	): Promise<void> {
		if (!Object.values(PhotoSizes).includes(size)) throw new BadRequestException("Unknown image size.");

		const photo = await this.photos.getPhoto(photoId);
		if (!photo) throw new NotFoundException();

		PhotoReadFilePermission.canOrThrow(req, photo);

		const ext = extname(photo.name);
		const path = this.photosFiles.getPhotoImagePath(photo, size);

		try {
			await this.photosFiles.fileExists(path);
		} catch {
			throw new NotFoundException("Image file not found.");
		}

		res.setHeader("Content-Type", contentType(ext) || "application/octet-stream");
		createReadStream(path).pipe(res);
	}
}
