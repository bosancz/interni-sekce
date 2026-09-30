import {
	BadRequestException,
	Body,
	Controller,
	Delete,
	Get,
	HttpCode,
	HttpStatus,
	InternalServerErrorException,
	Logger,
	NotFoundException,
	Param,
	ParseIntPipe,
	Put,
	Query,
	Req,
	Res,
} from "@nestjs/common";
import { ApiResponse, ApiTags } from "@nestjs/swagger";
import { Request, Response } from "express";
import { createReadStream } from "fs";
import { AcController, AcLinks, WithLinks } from "src/access-control/access-control-lib";
import { MemberPhotoResponse } from "src/api/albums/dto/photo-face.dto";
import { PhotoSizes } from "src/api/albums/dto/photo.dto";
import { Authenticated } from "src/auth/decorators/authenticated.decorator";
import { Config } from "src/config";
import { PhotoFacesService } from "src/models/albums/services/photo-faces.service";
import { PhotosFilesService } from "src/models/albums/services/photos-files.service";
import { FilesService } from "src/models/files/services/files.service";
import { MembersRepository } from "src/models/members/repositories/members.repository";
import {
	MemberPhotosListPermission,
	MemberProfilePhotoDeletePermission,
	MemberProfilePhotoReadPermission,
	MemberProfilePhotoUpdatePermission,
} from "../acl/member-photos.acl";
import { MemberPhotosQuery, MemberProfilePhotoBody } from "../dto/member.dto";

const PROFILE_PHOTO_SIZE = 512;
const PROFILE_PHOTO_PADDING = 0.4;

@Controller("members/:memberId")
@Authenticated()
@AcController()
@ApiTags("Members")
export class MemberPhotosController {
	private logger = new Logger(MemberPhotosController.name);

	constructor(
		private members: MembersRepository,
		private photoFacesService: PhotoFacesService,
		private photosFilesService: PhotosFilesService,
		private filesService: FilesService,
		private config: Config,
	) {}

	@Get("photos")
	@AcLinks(MemberPhotosListPermission)
	@ApiResponse({ status: 200, type: WithLinks(MemberPhotoResponse), isArray: true })
	async listMemberPhotos(
		@Param("memberId", ParseIntPipe) memberId: number,
		@Query() query: MemberPhotosQuery,
		@Req() req: Request,
	): Promise<MemberPhotoResponse[]> {
		const member = await this.members.getMember(memberId);
		if (!member) throw new NotFoundException();

		MemberPhotosListPermission.canOrThrow(req, member);

		return this.photoFacesService.getMemberPhotos(member.id, query);
	}

	@Get("profile-photo")
	@AcLinks(MemberProfilePhotoReadPermission)
	@ApiResponse({})
	async getMemberProfilePhoto(
		@Param("memberId", ParseIntPipe) memberId: number,
		@Req() req: Request,
		@Res() res: Response,
	): Promise<void> {
		const member = await this.members.getMember(memberId);
		if (!member) throw new NotFoundException();

		MemberProfilePhotoReadPermission.canOrThrow(req, member);

		if (!member.profilePhotoUpdatedAt) throw new NotFoundException("Profile photo not found.");

		const path = this.getProfilePhotoPath(member.id);

		try {
			await this.filesService.fileAccessible(path);
		} catch {
			throw new NotFoundException("Profile photo file not found.");
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

	@Put("profile-photo")
	@HttpCode(HttpStatus.NO_CONTENT)
	@AcLinks(MemberProfilePhotoUpdatePermission)
	@ApiResponse({ status: HttpStatus.NO_CONTENT })
	async updateMemberProfilePhoto(
		@Param("memberId", ParseIntPipe) memberId: number,
		@Body() body: MemberProfilePhotoBody,
		@Req() req: Request,
	): Promise<void> {
		const member = await this.members.getMember(memberId);
		if (!member) throw new NotFoundException();

		MemberProfilePhotoUpdatePermission.canOrThrow(req, member);

		const face = await this.photoFacesService.getFace(body.faceId);
		if (!face?.photo || face.memberId !== member.id) {
			throw new BadRequestException("The face is not assigned to this member.");
		}

		try {
			const image = await this.photosFilesService.cropFace(face.photo, face, {
				size: PROFILE_PHOTO_SIZE,
				padding: PROFILE_PHOTO_PADDING,
				sizes: [PhotoSizes.original, PhotoSizes.big],
			});
			await this.filesService.saveFile(this.getProfilePhotoPath(member.id), image);
		} catch (err) {
			this.logger.error(err);
			throw new InternalServerErrorException("Failed to save profile photo.");
		}

		await this.members.updateMember(member.id, { profilePhotoFaceId: face.id, profilePhotoUpdatedAt: new Date() });
	}

	@Delete("profile-photo")
	@HttpCode(HttpStatus.NO_CONTENT)
	@AcLinks(MemberProfilePhotoDeletePermission)
	@ApiResponse({ status: HttpStatus.NO_CONTENT })
	async deleteMemberProfilePhoto(
		@Param("memberId", ParseIntPipe) memberId: number,
		@Req() req: Request,
	): Promise<void> {
		const member = await this.members.getMember(memberId);
		if (!member) throw new NotFoundException();

		MemberProfilePhotoDeletePermission.canOrThrow(req, member);

		await this.members.updateMember(member.id, { profilePhotoFaceId: null, profilePhotoUpdatedAt: null });
		await this.filesService.deleteFile(this.getProfilePhotoPath(member.id)).catch(() => {});
	}

	private getProfilePhotoPath(memberId: number) {
		return `${this.config.fs.membersDir}/${memberId}/profile_photo.jpg`;
	}
}
