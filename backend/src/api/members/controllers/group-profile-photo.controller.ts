import {
	BadRequestException,
	Controller,
	Delete,
	Get,
	HttpCode,
	HttpStatus,
	Logger,
	NotFoundException,
	Param,
	ParseIntPipe,
	Put,
	Req,
	Res,
	UploadedFile,
	UseInterceptors,
} from "@nestjs/common";
import { FileInterceptor } from "@nestjs/platform-express";
import { ApiBody, ApiConsumes, ApiResponse, ApiTags } from "@nestjs/swagger";
import { Request, Response } from "express";
import { createReadStream } from "fs";
import { AcController, AcLinks } from "src/access-control/access-control-lib";
import { Authenticated } from "src/auth/decorators/authenticated.decorator";
import { Config } from "src/config";
import { FilesService } from "src/models/files/services/files.service";
import { GroupsRepository } from "src/models/members/repositories/groups.repository";
import {
	GroupProfilePhotoDeletePermission,
	GroupProfilePhotoReadPermission,
	GroupProfilePhotoUpdatePermission,
} from "../acl/groups.acl";
import sharp = require("sharp");

const PROFILE_PHOTO_SIZE = 512;
const PROFILE_PHOTO_MAX_UPLOAD_SIZE = 20 * 1024 * 1024;

@Controller("groups/:groupId/profile-photo")
@Authenticated()
@AcController()
@ApiTags("Members")
export class GroupProfilePhotoController {
	private logger = new Logger(GroupProfilePhotoController.name);

	constructor(
		private groups: GroupsRepository,
		private filesService: FilesService,
		private config: Config,
	) {}

	@Get("")
	@AcLinks(GroupProfilePhotoReadPermission)
	@ApiResponse({})
	async getGroupProfilePhoto(
		@Param("groupId", ParseIntPipe) groupId: number,
		@Req() req: Request,
		@Res() res: Response,
	): Promise<void> {
		const group = await this.groups.getGroup(groupId, { withDeleted: true });
		if (!group) throw new NotFoundException();

		GroupProfilePhotoReadPermission.canOrThrow(req, group);

		if (!group.profilePhotoUpdatedAt) throw new NotFoundException("Profile photo not found.");

		const path = this.getProfilePhotoPath(group.id);

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

	@Put("")
	@UseInterceptors(FileInterceptor("file", { limits: { fileSize: PROFILE_PHOTO_MAX_UPLOAD_SIZE } }))
	@HttpCode(HttpStatus.NO_CONTENT)
	@AcLinks(GroupProfilePhotoUpdatePermission)
	@ApiBody({
		schema: {
			type: "object",
			properties: {
				file: {
					type: "string",
					format: "binary",
				},
			},
		},
	})
	@ApiConsumes("multipart/form-data")
	@ApiResponse({ status: HttpStatus.NO_CONTENT })
	async uploadGroupProfilePhoto(
		@Param("groupId", ParseIntPipe) groupId: number,
		@Req() req: Request,
		@UploadedFile() file: Express.Multer.File,
	): Promise<void> {
		const group = await this.groups.getGroup(groupId);
		if (!group) throw new NotFoundException();

		GroupProfilePhotoUpdatePermission.canOrThrow(req, group);

		if (!file) throw new BadRequestException("Missing file.");

		let image: Buffer;
		try {
			image = await sharp(file.buffer)
				.rotate()
				.resize(PROFILE_PHOTO_SIZE, PROFILE_PHOTO_SIZE, { fit: "cover", position: "attention" })
				.flatten({ background: "#ffffff" })
				.jpeg({ quality: 88, mozjpeg: true })
				.toBuffer();
		} catch {
			throw new BadRequestException("Soubor není podporovaný obrázek.");
		}

		await this.filesService.saveFile(this.getProfilePhotoPath(group.id), image);

		await this.groups.updateGroup(group.id, { profilePhotoUpdatedAt: new Date() });
	}

	@Delete("")
	@HttpCode(HttpStatus.NO_CONTENT)
	@AcLinks(GroupProfilePhotoDeletePermission)
	@ApiResponse({ status: HttpStatus.NO_CONTENT })
	async deleteGroupProfilePhoto(@Param("groupId", ParseIntPipe) groupId: number, @Req() req: Request): Promise<void> {
		const group = await this.groups.getGroup(groupId);
		if (!group) throw new NotFoundException();

		GroupProfilePhotoDeletePermission.canOrThrow(req, group);

		await this.groups.updateGroup(group.id, { profilePhotoUpdatedAt: null });
		await this.filesService.deleteFile(this.getProfilePhotoPath(group.id)).catch(() => {});
	}

	private getProfilePhotoPath(groupId: number) {
		return `${this.config.fs.groupsDir}/${groupId}/profile_photo.jpg`;
	}
}
