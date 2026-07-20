import {
	BadRequestException,
	Body,
	Controller,
	Delete,
	Get,
	NotFoundException,
	Param,
	Patch,
	Post,
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
import { PhotosFilesService } from "src/models/albums/services/photos-files.service";
import { PhotosRepository } from "src/models/albums/repositories/photos.repository";
import {
	PhotoCreatePermission,
	PhotoDeletePermission,
	PhotoEditPermission,
	PhotoReadFilePermission,
	PhotoReadPermission,
	PhotosListPermission,
} from "../acl/photo.acl";
import { PhotoCreateBody, PhotoResponse, PhotoSizes, PhotoUpdateBody } from "../dto/photo.dto";

@Controller("photos")
@AcController()
@ApiTags("Photo gallery")
export class PhotosController {
	constructor(
		private photos: PhotosRepository,
		private photosFiles: PhotosFilesService,
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

		return this.photos.createPhoto(body.albumId, file, req.user?.userId ?? null);
	}

	@Get(":id")
	@AcLinks(PhotoReadPermission)
	@ApiResponse({ status: 200, type: WithLinks(PhotoResponse) })
	async getPhoto(@Param("id") id: number, @Req() req: Request) {
		const photo = await this.photos.getPhoto(id);
		if (!photo) throw new NotFoundException();

		PhotoReadPermission.canOrThrow(req, photo);

		return photo;
	}

	@Patch(":id")
	@AcLinks(PhotoEditPermission)
	@ApiResponse({ status: 204 })
	async updatePhoto(@Param("id") id: number, @Req() req: Request, @Body() body: PhotoUpdateBody): Promise<void> {
		const photo = await this.photos.getPhoto(id);
		if (!photo) throw new NotFoundException();

		PhotoEditPermission.canOrThrow(req, photo);

		await this.photos.updatePhoto(photo.id, body);
	}

	@Delete(":id")
	@AcLinks(PhotoDeletePermission)
	@ApiResponse({ status: 204 })
	async deletePhoto(@Param("id") id: number, @Req() req: Request): Promise<void> {
		const photo = await this.photos.getPhoto(id);
		if (!photo) throw new NotFoundException();

		PhotoDeletePermission.canOrThrow(req, photo);

		await this.photos.deletePhoto(photo.id);
	}

	@Get(":id/image/:size")
	@AcLinks(PhotoReadFilePermission)
	async getPhotoImage(
		@Param("id") id: number,
		@Param("size") size: PhotoSizes,
		@Req() req: Request,
		@Res() res: Response,
	): Promise<void> {
		if (!Object.values(PhotoSizes).includes(size)) throw new BadRequestException("Unknown image size.");

		const photo = await this.photos.getPhoto(id);
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
