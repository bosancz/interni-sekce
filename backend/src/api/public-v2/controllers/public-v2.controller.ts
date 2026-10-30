import {
	Controller,
	Get,
	InternalServerErrorException,
	NotFoundException,
	Param,
	ParseIntPipe,
	Query,
	Res,
} from "@nestjs/common";
import { ApiProduces, ApiTags } from "@nestjs/swagger";
import { Response } from "express";
import { createReadStream } from "fs";
import { contentType } from "mime-types";
import { extname } from "path";
import { PhotoSizes } from "src/api/albums/dto/photo.dto";
import { contentDispositionFilename } from "src/helpers/sanitizefilename";
import { PhotosFilesService } from "src/models/albums/services/photos-files.service";
import { PublicV2JournalQuery, PublicV2ProgramQuery, PublicV2RecentAlbumsQuery } from "../dto/public-v2.dto";
import { PublicV2Service } from "../services/public-v2.service";

@Controller("public/v2")
@ApiTags("Public API v2")
export class PublicV2Controller {
	constructor(
		private readonly publicService: PublicV2Service,
		private readonly photosFiles: PhotosFilesService,
	) {}

	@Get("program")
	async getPublicProgram(@Query() query: PublicV2ProgramQuery) {
		return this.publicService.getProgram(query);
	}

	@Get("program/:eventId/registration")
	@ApiProduces("application/pdf")
	async getPublicProgramRegistration(
		@Param("eventId", ParseIntPipe) eventId: number,
		@Res() res: Response,
	): Promise<void> {
		const { path, filename } = await this.publicService.getRegistrationFile(eventId);

		res.setHeader("Content-Type", "application/pdf");
		res.setHeader("Content-Disposition", `attachment; ${contentDispositionFilename(filename)}`);
		await this.sendFile(res, path);
	}

	@Get("journal")
	async getPublicJournal(@Query() query: PublicV2JournalQuery) {
		return this.publicService.getJournal(query);
	}

	@Get("reports/:eventId")
	async getPublicReport(@Param("eventId", ParseIntPipe) eventId: number) {
		return this.publicService.getReport(eventId);
	}

	@Get("reports/:eventId/chronicle")
	@ApiProduces("application/pdf")
	async getPublicReportChronicle(
		@Param("eventId", ParseIntPipe) eventId: number,
		@Query("download") download: string | undefined,
		@Res() res: Response,
	): Promise<void> {
		const { path, filename } = await this.publicService.getReportChronicleFile(eventId);

		res.setHeader("Content-Type", "application/pdf");
		res.setHeader(
			"Content-Disposition",
			`${download !== undefined ? "attachment" : "inline"}; ${contentDispositionFilename(filename)}`,
		);
		await this.sendFile(res, path);
	}

	@Get("albums/recent")
	async getPublicRecentAlbums(@Query() query: PublicV2RecentAlbumsQuery) {
		return this.publicService.getRecentAlbums(query.limit);
	}

	@Get("albums/:albumId")
	async getPublicAlbum(@Param("albumId", ParseIntPipe) albumId: number) {
		return this.publicService.getAlbum(albumId);
	}

	@Get("albums/:albumId/photos")
	async getPublicAlbumPhotos(@Param("albumId", ParseIntPipe) albumId: number) {
		return this.publicService.getAlbumPhotos(albumId);
	}

	@Get("albums/:albumId/download")
	async downloadPublicAlbum(@Param("albumId", ParseIntPipe) albumId: number, @Res() res: Response): Promise<void> {
		const { album, photos } = await this.publicService.getAlbumDownload(albumId);

		await this.photosFiles.sendAlbumArchive(res, album, photos);
	}

	@Get("photos/:photoId/:size")
	async getPublicPhoto(
		@Param("photoId", ParseIntPipe) photoId: number,
		@Param("size") size: PhotoSizes,
		@Res() res: Response,
	): Promise<void> {
		const { path, name } = await this.publicService.getPhotoImagePath(photoId, size);

		res.setHeader("Content-Type", contentType(extname(name)) || "application/octet-stream");
		await this.streamFile(res, path);
	}

	@Get("groups")
	async getPublicGroups() {
		return this.publicService.getGroups();
	}

	@Get("groups/:groupId/leader/profile-photo")
	async getPublicGroupLeaderProfilePhoto(
		@Param("groupId", ParseIntPipe) groupId: number,
		@Res() res: Response,
	): Promise<void> {
		const path = await this.publicService.getGroupLeaderProfilePhotoPath(groupId);

		res.setHeader("Content-Type", "image/jpeg");
		await this.streamFile(res, path);
	}

	@Get("board-members")
	async getPublicBoardMembers() {
		return this.publicService.getBoardMembers();
	}

	@Get("board-members/:memberId/profile-photo")
	async getPublicBoardMemberProfilePhoto(
		@Param("memberId", ParseIntPipe) memberId: number,
		@Res() res: Response,
	): Promise<void> {
		const path = await this.publicService.getBoardMemberProfilePhotoPath(memberId);

		res.setHeader("Content-Type", "image/jpeg");
		await this.streamFile(res, path);
	}

	private async sendFile(res: Response, path: string): Promise<void> {
		await new Promise<void>((resolve, reject) => {
			res.sendFile(path, (err) => (err ? reject(new NotFoundException("File not found.")) : resolve()));
		});
	}

	private async streamFile(res: Response, path: string): Promise<void> {
		try {
			await this.photosFiles.fileExists(path);
		} catch {
			throw new NotFoundException("File not found.");
		}

		res.setHeader("Cache-Control", "public, max-age=86400");
		createReadStream(path).pipe(res);
	}
}
