import {
	Controller,
	Get,
	InternalServerErrorException,
	NotFoundException,
	Param,
	ParseIntPipe,
	Query,
	Req,
	Res,
} from "@nestjs/common";
import { ApiProduces, ApiResponse, ApiTags } from "@nestjs/swagger";
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
	PublicBoardMembersPermission,
	PublicGroupsPermission,
	PublicProgramIcalPermission,
	PublicProgramPermission,
	PublicReportPermission,
	PublicReportsPermission,
} from "../acl/public.acl";
import { PublicGalleryQuery, PublicProgramQuery, PublicReportsQuery } from "../dto/public.dto";
import { ProgramIcalService } from "../services/program-ical.service";
import { PublicService } from "../services/public.service";
import { contentDispositionFilename } from "src/helpers/sanitizefilename";

@Controller("public")
@AcController()
@ApiTags("Public API")
export class PublicController {
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

	@Get("reports")
	@AcLinks(PublicReportsPermission)
	async getReports(@Query() query: PublicReportsQuery) {
		return this.publicService.getReports({ limit: query.limit, offset: query.offset });
	}

	@Get("reports/:id")
	@AcLinks(PublicReportPermission)
	async getReport(@Param("id", ParseIntPipe) id: number) {
		return this.publicService.getReport(id);
	}

	@Get("reports/:id/chronicle")
	@ApiProduces("application/pdf")
	async getReportChronicle(
		@Param("id", ParseIntPipe) id: number,
		@Query("download") download: string | undefined,
		@Res() res: Response,
	): Promise<void> {
		const { path, filename } = await this.publicService.getReportChronicleFile(id);

		res.setHeader("Content-Type", "application/pdf");
		res.setHeader(
			"Content-Disposition",
			`${download !== undefined ? "attachment" : "inline"}; ${contentDispositionFilename(filename)}`,
		);

		await new Promise<void>((resolve, reject) => {
			res.sendFile(path, (err) => (err ? reject(new NotFoundException("Chronicle file not found.")) : resolve()));
		});
	}

	@Get("groups")
	@AcLinks(PublicGroupsPermission)
	async getGroups() {
		return this.publicService.getGroups();
	}

	@Get("groups/:id/leader/profile-photo")
	async getGroupLeaderProfilePhoto(@Param("id", ParseIntPipe) id: number, @Res() res: Response): Promise<void> {
		const path = await this.publicService.getGroupLeaderProfilePhotoPath(id);

		try {
			await this.photosFiles.fileExists(path);
		} catch {
			throw new NotFoundException("Profile photo file not found.");
		}

		res.setHeader("Content-Type", "image/jpeg");
		res.setHeader("Cache-Control", "public, max-age=86400");
		createReadStream(path).pipe(res);
	}

	@Get("board-members")
	@AcLinks(PublicBoardMembersPermission)
	async getBoardMembers() {
		return this.publicService.getBoardMembers();
	}

	@Get("board-members/:memberId/profile-photo")
	async getBoardMemberProfilePhoto(
		@Param("memberId", ParseIntPipe) memberId: number,
		@Res() res: Response,
	): Promise<void> {
		const path = await this.publicService.getBoardMemberProfilePhotoPath(memberId);

		try {
			await this.photosFiles.fileExists(path);
		} catch {
			throw new NotFoundException("Profile photo file not found.");
		}

		res.setHeader("Content-Type", "image/jpeg");
		res.setHeader("Cache-Control", "public, max-age=86400");
		createReadStream(path).pipe(res);
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
		return this.publicService.getAlbumPreview(id);
	}

	@Get("gallery/:id/download")
	async downloadAlbum(@Param("id", ParseIntPipe) id: number, @Res() res: Response): Promise<void> {
		const { album, photos } = await this.publicService.getAlbumDownload(id);

		await this.photosFiles.sendAlbumArchive(res, album, photos);
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
