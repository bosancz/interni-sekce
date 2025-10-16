import {
	Controller,
	Delete,
	Get,
	HttpCode,
	HttpStatus,
	InternalServerErrorException,
	Logger,
	NotFoundException,
	Param,
	Put,
	Req,
	Res,
	UploadedFile,
	UseGuards,
	UseInterceptors,
} from "@nestjs/common";
import { FileInterceptor } from "@nestjs/platform-express";
import { ApiBody, ApiConsumes, ApiResponse, ApiTags } from "@nestjs/swagger";
import { Request, Response } from "express";
import { createReadStream } from "fs";
import { contentType } from "mime-types";
import { extname } from "path";
import { AcController, AcLinks } from "src/access-control/access-control-lib";
import { UserGuard } from "src/auth/guards/user.guard";
import { Config } from "src/config";
import { FilesService } from "src/models/files/services/files.service";
import { MembersRepository } from "src/models/members/repositories/members.repository";
import {
	MemberInsuranceCardDeletePermission,
	MemberInsuranceCardReadPermission,
	MemberInsuranceCardUploadPermission,
} from "../acl/member-insurance-card.acl";

@Controller("members/:id/insurance-card")
@UseGuards(UserGuard)
@AcController()
@ApiTags("Members")
export class MemberInsuranceCardController {
	logger = new Logger(MemberInsuranceCardController.name);

	constructor(
		private membersService: MembersRepository,
		private filesService: FilesService,
		private readonly config: Config,
	) {}

	@Get("")
	@AcLinks(MemberInsuranceCardReadPermission)
	@ApiResponse({})
	async getInsuranceCard(@Req() req: Request, @Res() res: Response, @Param("id") memberId: number) {
		const member = await this.membersService.getMember(memberId);
		if (!member) throw new NotFoundException("Member not found");

		MemberInsuranceCardReadPermission.canOrThrow(req, member);

		if (!member.insuranceCardFile) throw new NotFoundException("Insurance card not found");
		const path = this.getInsuraceCardPath(member.id, member.insuranceCardFile);

		res.setHeader("Content-Disposition", `inline; filename="insurance_card.${member.insuranceCardFile}"`);
		res.setHeader("Content-Type", contentType(member.insuranceCardFile) || "application/octet-stream");

		createReadStream(path).pipe(res);
	}

	@Put("")
	@UseInterceptors(FileInterceptor("file"))
	@HttpCode(HttpStatus.NO_CONTENT)
	@AcLinks(MemberInsuranceCardUploadPermission)
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
	async uploadInsuranceCard(
		@Req() req: Request,
		@Param("id") memberId: number,
		@UploadedFile() file: Express.Multer.File,
	) {
		const member = await this.membersService.getMember(memberId);
		if (!member) throw new NotFoundException("Member not found");

		MemberInsuranceCardUploadPermission.canOrThrow(req, member);

		const ext = extname(file.originalname).slice(1);
		const path = this.getInsuraceCardPath(member.id, ext);

		try {
			await this.membersService.updateMember(member.id, { insuranceCardFile: ext });

			await this.filesService.saveFile(path, file.buffer);
		} catch (e) {
			this.logger.error(e);
			this.filesService.deleteFile(path).catch(() => {});
			throw new InternalServerErrorException("Failed to save card.");
		}
	}

	@Delete("")
	@AcLinks(MemberInsuranceCardDeletePermission)
	@ApiResponse({ status: HttpStatus.NO_CONTENT })
	async deleteInsuranceCard(@Req() req: Request, @Param("id") memberId: number) {
		const member = await this.membersService.getMember(memberId);
		if (!member) throw new NotFoundException("Member not found");

		MemberInsuranceCardDeletePermission.canOrThrow(req, member);

		if (!member.insuranceCardFile) throw new NotFoundException("Insurance card not found");

		const path = this.getInsuraceCardPath(member.id, member.insuranceCardFile);

		try {
			await this.filesService.deleteFile(path);

			await this.membersService.updateMember(member.id, { insuranceCardFile: null });
		} catch (e) {
			this.logger.error(e);
			this.filesService.deleteFile(path).catch(() => {});
			throw new InternalServerErrorException("Failed to delete card.");
		}
	}

	private getInsuraceCardPath(memberId: number, extenstion: string) {
		return `${this.config.fs.membersDir}/${memberId}/insurance_card.${extenstion}`;
	}
}
