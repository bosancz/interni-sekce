import { DateTime } from "luxon";
import {
	BadRequestException,
	Body,
	Controller,
	Delete,
	Get,
	HttpCode,
	Logger,
	NotFoundException,
	Param,
	ParseIntPipe,
	Post,
	Put,
	Query,
	Req,
	Res,
	UnprocessableEntityException,
	UploadedFile,
	UseInterceptors,
} from "@nestjs/common";
import { FileInterceptor } from "@nestjs/platform-express";
import { ApiBody, ApiConsumes, ApiProduces, ApiResponse, ApiTags } from "@nestjs/swagger";
import { Request, Response } from "express";
import { readFile, unlink } from "fs/promises";
import { Config, StaticConfig } from "src/config";
import { contentDispositionFilename } from "src/helpers/sanitizefilename";
import { FilesService } from "src/models/files/services/files.service";
import { AcController, AcLinks, WithLinks } from "src/access-control/access-control-lib";
import { Authenticated } from "src/auth/decorators/authenticated.decorator";
import { PhotosRepository } from "src/models/albums/repositories/photos.repository";
import { Event } from "src/models/events/entities/event.entity";
import { getEventChroniclePath } from "src/models/events/helpers/event-chronicle";
import { EventsRepository } from "src/models/events/repositories/events.repository";
import { NotificationsService } from "src/models/notifications/services/notifications.service";
import {
	EventReportChronicleDeletePermission,
	EventReportChronicleEditPermission,
	EventReportChronicleReadPermission,
	EventReportEditPermission,
	EventReportPublishPermission,
	EventReportReadPermission,
	EventReportUnpublishPermission,
	ReportsListPermission,
	ReportsYearsPermission,
} from "../acl/events.acl";
import {
	EventReportResponse,
	EventReportUpdateBody,
	EventWithReportResponse,
	ReportsListQuery,
} from "../dto/event.dto";

const emptyToNull = (value: string | null | undefined) =>
	value === undefined ? undefined : value?.trim() ? value : null;

@Controller("events")
@Authenticated()
@AcController()
@ApiTags("Events")
export class EventsReportsController {
	private readonly logger = new Logger(EventsReportsController.name);

	constructor(
		private events: EventsRepository,
		private notificationsService: NotificationsService,
		private fileService: FilesService,
		private config: Config,
	) {}

	private chroniclePath(event: Event): string {
		return getEventChroniclePath(this.config.fs.eventsDir, event);
	}

	@Get(":eventId/report")
	@AcLinks(EventReportReadPermission)
	@ApiResponse({ status: 200, type: EventReportResponse })
	async getEventReport(
		@Req() req: Request,
		@Param("eventId", ParseIntPipe) eventId: number,
	): Promise<EventReportResponse> {
		const event = await this.events.getEvent(eventId);
		if (!event) throw new NotFoundException();

		EventReportReadPermission.canOrThrow(req, event);

		return { report: await this.events.getEventReport(eventId) };
	}

	@Put(":eventId/report")
	@HttpCode(204)
	@AcLinks(EventReportEditPermission)
	@ApiResponse({ status: 204 })
	async updateEventReport(
		@Req() req: Request,
		@Param("eventId", ParseIntPipe) eventId: number,
		@Body() body: EventReportUpdateBody,
	): Promise<void> {
		const event = await this.events.getEvent(eventId);
		if (!event) throw new NotFoundException();

		EventReportEditPermission.canOrThrow(req, event);

		const { report, publicReport, river, waterKm } = body;
		const data: Partial<Event> = { report: emptyToNull(report), river, waterKm };

		if (publicReport !== undefined) {
			data.publicReport = emptyToNull(publicReport);
			if (!data.publicReport && !event.chronicleFileName) data.reportPublishedAt = null;
		}

		await this.events.updateEvent(eventId, data);
	}

	@Get(":eventId/report/chronicle")
	@AcLinks(EventReportChronicleReadPermission)
	@ApiProduces("application/pdf")
	async getEventReportChronicle(
		@Req() req: Request,
		@Param("eventId", ParseIntPipe) eventId: number,
		@Res() res: Response,
	): Promise<void> {
		const event = await this.events.getEvent(eventId);
		if (!event) throw new NotFoundException();

		EventReportChronicleReadPermission.canOrThrow(req, event);

		res.setHeader("Content-Type", "application/pdf");
		res.setHeader("Content-Disposition", `inline; ${contentDispositionFilename(event.chronicleFileName!)}`);

		await new Promise<void>((resolve, reject) => {
			res.sendFile(this.chroniclePath(event), (err) =>
				err ? reject(new NotFoundException("Chronicle file not found.")) : resolve(),
			);
		});
	}

	@Put(":eventId/report/chronicle")
	@HttpCode(204)
	@AcLinks(EventReportChronicleEditPermission)
	@ApiResponse({ status: 204 })
	@UseInterceptors(
		FileInterceptor("file", {
			dest: "./uploads_temp",
			limits: { fileSize: StaticConfig.chronicles.maxUploadSize },
		}),
	)
	@ApiConsumes("multipart/form-data")
	@ApiBody({ schema: { type: "object", properties: { file: { type: "string", format: "binary" } } } })
	async uploadEventReportChronicle(
		@Req() req: Request,
		@Param("eventId", ParseIntPipe) eventId: number,
		@UploadedFile() file: Express.Multer.File,
	): Promise<void> {
		if (!file) throw new BadRequestException("File not provided.");

		let data: Buffer;
		try {
			data = await readFile(file.path);
		} finally {
			await unlink(file.path).catch(() => undefined);
		}

		const event = await this.events.getEvent(eventId);
		if (!event) throw new NotFoundException();

		EventReportChronicleEditPermission.canOrThrow(req, event);

		if (data.subarray(0, 5).toString("latin1") !== "%PDF-") {
			throw new UnprocessableEntityException("Chronicle must be a PDF file.");
		}

		const originalName = Buffer.from(file.originalname, "latin1").toString("utf8");
		const fileName = /\.pdf$/i.test(originalName) ? originalName : `${originalName}.pdf`;

		await this.fileService.saveFile(this.chroniclePath(event), data);
		await this.events.updateEvent(eventId, {
			chronicleFileName: fileName,
			chronicleSize: data.length,
			chronicleUpdatedAt: new Date(),
		});
	}

	@Delete(":eventId/report/chronicle")
	@HttpCode(204)
	@AcLinks(EventReportChronicleDeletePermission)
	@ApiResponse({ status: 204 })
	async deleteEventReportChronicle(
		@Req() req: Request,
		@Param("eventId", ParseIntPipe) eventId: number,
	): Promise<void> {
		const event = await this.events.getEvent(eventId);
		if (!event) throw new NotFoundException();

		EventReportChronicleDeletePermission.canOrThrow(req, event);

		await this.fileService.deleteFile(this.chroniclePath(event)).catch(() => undefined);
		await this.events.updateEvent(eventId, {
			chronicleFileName: null,
			chronicleSize: null,
			chronicleUpdatedAt: null,
			...(event.publicReport?.trim() ? {} : { reportPublishedAt: null }),
		});
	}

	@Post(":eventId/report/publish")
	@HttpCode(204)
	@AcLinks(EventReportPublishPermission)
	@ApiResponse({ status: 204 })
	async publishEventReport(@Req() req: Request, @Param("eventId", ParseIntPipe) eventId: number): Promise<void> {
		const event = await this.events.getEvent(eventId);
		if (!event) throw new NotFoundException();

		EventReportPublishPermission.canOrThrow(req, event);

		if (!event.publicReport?.trim() && !event.chronicleFileName)
			throw new UnprocessableEntityException("Report has neither a public summary nor a chronicle.");
		const report = await this.events.getEventReport(eventId);
		if (!report?.trim()) throw new UnprocessableEntityException("Report has no report for the revizor.");

		await this.events.updateEvent(eventId, { reportPublishedAt: new Date() });

		this.notificationsService
			.onEventReportPublished(event, req.user?.userId)
			.catch((err) => this.logger.error(`Failed to send event report notifications: ${err.message}`));
	}

	@Delete(":eventId/report/publish")
	@HttpCode(204)
	@AcLinks(EventReportUnpublishPermission)
	@ApiResponse({ status: 204 })
	async unpublishEventReport(@Req() req: Request, @Param("eventId", ParseIntPipe) eventId: number): Promise<void> {
		const event = await this.events.getEvent(eventId);
		if (!event) throw new NotFoundException();

		EventReportUnpublishPermission.canOrThrow(req, event);

		await this.events.updateEvent(eventId, { reportPublishedAt: null });
	}
}

@Controller("reports")
@Authenticated()
@AcController()
@ApiTags("Events")
export class ReportsController {
	constructor(
		private events: EventsRepository,
		private photos: PhotosRepository,
	) {}

	@Get("years")
	@AcLinks(ReportsYearsPermission)
	@ApiResponse({ status: 200, type: Number, isArray: true })
	async listReportsYears(@Req() req: Request): Promise<number[]> {
		ReportsYearsPermission.canOrThrow(req);

		return this.events.getReportsYears();
	}

	@Get()
	@AcLinks(ReportsListPermission)
	@ApiResponse({ status: 200, type: WithLinks(EventWithReportResponse), isArray: true })
	async listReports(@Req() req: Request, @Query() query: ReportsListQuery): Promise<EventWithReportResponse[]> {
		ReportsListPermission.canOrThrow(req);

		const events = await this.events.getReports(query);
		const coverPhotos = await this.photos.getCoverPhotosByAlbums(
			events.flatMap((event) => (event.album ? [event.album.id] : [])),
		);

		const accounting = await this.events.getReportsAccounting(events.map((event) => event.id));

		return events.map((event) => {
			const { persons = 0, expenses = [] } = accounting.get(event.id) ?? {};
			return {
				...event,
				report: event.report ?? null,
				accounting: {
					days: getEventDays(event),
					persons,
					total: expenses.reduce((sum, expense) => sum + expense.total, 0),
					categories: expenses,
				},
				album: event.album ? { ...event.album, coverPhoto: coverPhotos.get(event.album.id) } : undefined,
			};
		});
	}
}

function getEventDays(event: Pick<Event, "dateFrom" | "dateTill">) {
	const days = DateTime.fromISO(event.dateTill).diff(DateTime.fromISO(event.dateFrom), "days").days + 1;
	return days > 0 ? Math.round(days) : 1;
}
