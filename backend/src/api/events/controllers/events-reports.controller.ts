import { Body, Controller, Get, Logger, NotFoundException, Param, ParseIntPipe, Put, Req } from "@nestjs/common";
import { ApiResponse, ApiTags } from "@nestjs/swagger";
import { InjectRepository } from "@nestjs/typeorm";
import { Request } from "express";
import { AcController, AcLinks } from "src/access-control/access-control-lib";
import { Authenticated } from "src/auth/decorators/authenticated.decorator";
import { Event } from "src/models/events/entities/event.entity";
import { EventsRepository } from "src/models/events/repositories/events.repository";
import { NotificationsService } from "src/models/notifications/services/notifications.service";
import { Repository } from "typeorm";
import { EventReportEditPermission, EventReportReadPermission } from "../acl/events.acl";
import { EventReportResponse, EventReportUpdateBody } from "../dto/event.dto";

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
		@InjectRepository(Event) private eventsRepository: Repository<Event>,
		private notificationsService: NotificationsService,
	) {}

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

		const report = await this.eventsRepository.findOne({
			where: { id: eventId },
			select: { id: true, reportComplications: true, reportPraises: true, reportComplaints: true },
			withDeleted: true,
		});

		return {
			reportComplications: report?.reportComplications ?? null,
			reportPraises: report?.reportPraises ?? null,
			reportComplaints: report?.reportComplaints ?? null,
		};
	}

	@Put(":eventId/report")
	@AcLinks(EventReportEditPermission)
	@ApiResponse({ status: 200, type: EventReportResponse })
	async updateEventReport(
		@Req() req: Request,
		@Param("eventId", ParseIntPipe) eventId: number,
		@Body() body: EventReportUpdateBody,
	): Promise<EventReportResponse> {
		const event = await this.events.getEvent(eventId);
		if (!event) throw new NotFoundException();

		EventReportEditPermission.canOrThrow(req, event);

		const { report, river, waterKm, reportComplications, reportPraises, reportComplaints } = body;
		const data: Partial<Event> = {
			river,
			waterKm,
			reportComplications: emptyToNull(reportComplications),
			reportPraises: emptyToNull(reportPraises),
			reportComplaints: emptyToNull(reportComplaints),
		};

		let published = false;
		if (report !== undefined) {
			data.report = emptyToNull(report);
			if (!data.report) data.reportPublishedAt = null;
			else if (!event.reportPublishedAt) {
				data.reportPublishedAt = new Date();
				published = true;
			}
		}

		await this.events.updateEvent(eventId, data);

		if (published) {
			this.notificationsService
				.onEventReportPublished(event, req.user?.userId)
				.catch((err) => this.logger.error(`Failed to send event report notifications: ${err.message}`));
		}

		return this.getEventReport(req, eventId);
	}
}
