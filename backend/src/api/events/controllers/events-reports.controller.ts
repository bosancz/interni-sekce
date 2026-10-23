import {
	Body,
	Controller,
	Delete,
	HttpCode,
	Logger,
	NotFoundException,
	Param,
	ParseIntPipe,
	Post,
	Put,
	Req,
	UnprocessableEntityException,
} from "@nestjs/common";
import { ApiResponse, ApiTags } from "@nestjs/swagger";
import { Request } from "express";
import { AcController, AcLinks } from "src/access-control/access-control-lib";
import { Authenticated } from "src/auth/decorators/authenticated.decorator";
import { Event } from "src/models/events/entities/event.entity";
import { EventsRepository } from "src/models/events/repositories/events.repository";
import { NotificationsService } from "src/models/notifications/services/notifications.service";
import {
	EventReportEditPermission,
	EventReportPublishPermission,
	EventReportUnpublishPermission,
} from "../acl/events.acl";
import { EventReportUpdateBody } from "../dto/event.dto";

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
	) {}

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
			if (!data.publicReport) data.reportPublishedAt = null;
		}

		await this.events.updateEvent(eventId, data);
	}

	@Post(":eventId/report/publish")
	@HttpCode(204)
	@AcLinks(EventReportPublishPermission)
	@ApiResponse({ status: 204 })
	async publishEventReport(@Req() req: Request, @Param("eventId", ParseIntPipe) eventId: number): Promise<void> {
		const event = await this.events.getEvent(eventId);
		if (!event) throw new NotFoundException();

		EventReportPublishPermission.canOrThrow(req, event);

		if (!event.publicReport?.trim()) throw new UnprocessableEntityException("Report has no public summary.");
		if (!event.report?.trim()) throw new UnprocessableEntityException("Report has no report for the revizor.");

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
