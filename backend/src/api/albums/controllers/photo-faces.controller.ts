import {
	Body,
	Controller,
	Delete,
	Get,
	HttpStatus,
	Logger,
	NotFoundException,
	Param,
	ParseIntPipe,
	Patch,
	Req,
	Res,
} from "@nestjs/common";
import { ApiResponse, ApiTags } from "@nestjs/swagger";
import { Request, Response } from "express";
import { createReadStream } from "fs";
import { AcController, AcLinks, WithLinks } from "src/access-control/access-control-lib";
import { Authenticated } from "src/auth/decorators/authenticated.decorator";
import { MembersRepository } from "src/models/members/repositories/members.repository";
import { PhotosRepository } from "src/models/albums/repositories/photos.repository";
import { PhotoFacesMatchingService } from "src/models/albums/services/photo-faces-matching.service";
import { PhotoFacesService } from "src/models/albums/services/photo-faces.service";
import { PhotosFilesService } from "src/models/albums/services/photos-files.service";
import {
	PhotoFaceAssignmentResetPermission,
	PhotoFaceDeletePermission,
	PhotoFaceEditPermission,
	PhotoFaceReadFilePermission,
	PhotoFacesListPermission,
	PhotoFaceSuggestionsListPermission,
} from "../acl/photo-face.acl";
import { PhotoFaceResponse, PhotoFaceSuggestionResponse, PhotoFaceUpdateBody } from "../dto/photo-face.dto";

@Controller("photos/:photoId/faces")
@Authenticated()
@AcController()
@ApiTags("Photo gallery")
export class PhotoFacesController {
	private logger = new Logger(PhotoFacesController.name);

	constructor(
		private photos: PhotosRepository,
		private photoFacesService: PhotoFacesService,
		private photoFacesMatchingService: PhotoFacesMatchingService,
		private photosFilesService: PhotosFilesService,
		private members: MembersRepository,
	) {}

	@Get()
	@AcLinks(PhotoFacesListPermission)
	@ApiResponse({ status: 200, type: WithLinks(PhotoFaceResponse), isArray: true })
	async listPhotoFaces(
		@Param("photoId", ParseIntPipe) photoId: number,
		@Req() req: Request,
	): Promise<PhotoFaceResponse[]> {
		const photo = await this.photos.getPhoto(photoId);
		if (!photo) throw new NotFoundException();

		PhotoFacesListPermission.canOrThrow(req, photo);

		return this.photoFacesService.getPhotoFaces(photo.id);
	}

	@Get(":faceId/suggestions")
	@AcLinks(PhotoFaceSuggestionsListPermission)
	@ApiResponse({ status: 200, type: PhotoFaceSuggestionResponse, isArray: true })
	async listPhotoFaceSuggestions(
		@Param("photoId", ParseIntPipe) photoId: number,
		@Param("faceId", ParseIntPipe) faceId: number,
		@Req() req: Request,
	): Promise<PhotoFaceSuggestionResponse[]> {
		const face = await this.photoFacesService.getPhotoFace(photoId, faceId);
		if (!face) throw new NotFoundException();

		PhotoFaceSuggestionsListPermission.canOrThrow(req, face);

		return this.photoFacesMatchingService.getSuggestions(face);
	}

	@Patch(":faceId")
	@AcLinks(PhotoFaceEditPermission)
	@ApiResponse({ status: 204 })
	async updatePhotoFace(
		@Param("photoId", ParseIntPipe) photoId: number,
		@Param("faceId", ParseIntPipe) faceId: number,
		@Body() body: PhotoFaceUpdateBody,
		@Req() req: Request,
	): Promise<void> {
		const face = await this.photoFacesService.getPhotoFace(photoId, faceId);
		if (!face) throw new NotFoundException();

		PhotoFaceEditPermission.canOrThrow(req, face);

		const memberId = body.memberId ?? null;
		if (memberId !== null && !(await this.members.getMember(memberId))) {
			throw new NotFoundException("Member not found.");
		}

		await this.photoFacesService.assignPhotoFace(face.id, memberId, req.user?.userId ?? null);
		await this.photoFacesMatchingService.matchPhoto(face.photoId);

		this.photoFacesMatchingService.onFaceChanged(face, face.memberId);
	}

	@Delete(":faceId/assignment")
	@AcLinks(PhotoFaceAssignmentResetPermission)
	@ApiResponse({ status: 204 })
	async resetPhotoFaceAssignment(
		@Param("photoId", ParseIntPipe) photoId: number,
		@Param("faceId", ParseIntPipe) faceId: number,
		@Req() req: Request,
	): Promise<void> {
		const face = await this.photoFacesService.getPhotoFace(photoId, faceId);
		if (!face) throw new NotFoundException();

		PhotoFaceAssignmentResetPermission.canOrThrow(req, face);

		await this.photoFacesService.resetPhotoFaceAssignment(face.id);
		await this.photoFacesMatchingService.matchPhoto(face.photoId);

		this.photoFacesMatchingService.onFaceChanged(face, face.memberId);
	}

	@Delete(":faceId")
	@AcLinks(PhotoFaceDeletePermission)
	@ApiResponse({ status: 204 })
	async deletePhotoFace(
		@Param("photoId", ParseIntPipe) photoId: number,
		@Param("faceId", ParseIntPipe) faceId: number,
		@Req() req: Request,
	): Promise<void> {
		const face = await this.photoFacesService.getPhotoFace(photoId, faceId);
		if (!face) throw new NotFoundException();

		PhotoFaceDeletePermission.canOrThrow(req, face);

		await this.photoFacesService.deletePhotoFace(face.id);

		if (face.memberId !== null) this.photoFacesMatchingService.onFaceChanged(face, face.memberId);
	}

	@Get(":faceId/image")
	@AcLinks(PhotoFaceReadFilePermission)
	async getPhotoFaceImage(
		@Param("photoId", ParseIntPipe) photoId: number,
		@Param("faceId", ParseIntPipe) faceId: number,
		@Req() req: Request,
		@Res() res: Response,
	): Promise<void> {
		const face = await this.photoFacesService.getPhotoFace(photoId, faceId);
		if (!face?.photo) throw new NotFoundException();

		PhotoFaceReadFilePermission.canOrThrow(req, face);

		let path: string;
		try {
			path = await this.photosFilesService.getFaceImage(face.photo, face.id, face);
		} catch (err) {
			this.logger.warn(`Face ${face.id} image: ${err}`);
			throw new NotFoundException("Image file not found.");
		}

		res.setHeader("Content-Type", "image/jpeg");
		res.setHeader("Cache-Control", "private, max-age=604800");

		const stream = createReadStream(path);
		stream.on("error", (err) => {
			this.logger.error(err);
			if (!res.headersSent) res.status(HttpStatus.INTERNAL_SERVER_ERROR);
			res.end();
		});
		stream.pipe(res);
	}
}
