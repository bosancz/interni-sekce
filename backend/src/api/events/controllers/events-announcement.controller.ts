import {
	Controller,
	Delete,
	Get,
	HttpCode,
	NotFoundException,
	Param,
	ParseIntPipe,
	Post,
	Req,
	Res,
	StreamableFile,
} from "@nestjs/common";
import { ApiResponse, ApiTags } from "@nestjs/swagger";
import { InjectRepository } from "@nestjs/typeorm";
import { Request, Response } from "express";
import { AcController, AcLinks } from "src/access-control/access-control-lib";
import { Authenticated } from "src/auth/decorators/authenticated.decorator";
import { Event } from "src/models/events/entities/event.entity";
import { EventsRepository } from "src/models/events/repositories/events.repository";
import { EventAnnouncementService } from "src/models/events/services/event-announcement.service";
import { Repository } from "typeorm";
import {
	EventAnnouncementGetPermission,
	EventAnnouncementSentPermission,
	EventAnnouncementUnsentPermission,
} from "../acl/events.acl";

@Controller("events")
@Authenticated()
@AcController()
@ApiTags("Events")
export class EventsAnnouncementController {
	constructor(
		private readonly events: EventsRepository,
		@InjectRepository(Event) private readonly eventsRepository: Repository<Event>,
		private readonly eventAnnouncementService: EventAnnouncementService,
	) {}

	@Get(":eventId/announcement")
	@HttpCode(200)
	@AcLinks(EventAnnouncementGetPermission)
	@ApiResponse({ status: 200 })
	async getEventAnnouncement(
		@Req() req: Request,
		@Param("eventId", ParseIntPipe) eventId: number,
		@Res({ passthrough: true }) res: Response,
	): Promise<StreamableFile> {
		//const event = await this.events.getEvent(eventId);

		const event = await this.eventsRepository.findOne({
			where: { id: eventId },
			relations: { attendees: { member: { contacts: true } } }, // Important: load nested member relation
		});

		if (!event) throw new NotFoundException();

		EventAnnouncementGetPermission.canOrThrow(req, event);

		const { fileBuffer, fileName } = await this.eventAnnouncementService.generateAnnouncement(event);

		res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");

		res.setHeader("Content-Disposition", `attachment; filename="${fileName}"`);
		res.setHeader("Access-Control-Expose-Headers", "Content-Disposition");

		return new StreamableFile(fileBuffer);
	}

	@Post(":eventId/announcement/sent")
	@HttpCode(204)
	@AcLinks(EventAnnouncementSentPermission)
	@ApiResponse({ status: 204 })
	async markAnnouncementSent(@Req() req: Request, @Param("eventId", ParseIntPipe) eventId: number): Promise<void> {
		const event = await this.events.getEvent(eventId, { leaders: true });
		if (!event) throw new NotFoundException();

		EventAnnouncementSentPermission.canOrThrow(req, event);

		await this.events.updateEvent(eventId, { announcementSentAt: new Date() });
	}

	@Delete(":eventId/announcement/sent")
	@HttpCode(204)
	@AcLinks(EventAnnouncementUnsentPermission)
	@ApiResponse({ status: 204 })
	async unmarkAnnouncementSent(@Req() req: Request, @Param("eventId", ParseIntPipe) eventId: number): Promise<void> {
		const event = await this.events.getEvent(eventId, { leaders: true });
		if (!event) throw new NotFoundException();

		EventAnnouncementUnsentPermission.canOrThrow(req, event);

		await this.events.updateEvent(eventId, { announcementSentAt: null });
	}
}
