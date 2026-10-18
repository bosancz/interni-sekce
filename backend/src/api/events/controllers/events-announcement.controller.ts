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
	UnprocessableEntityException,
} from "@nestjs/common";
import { ApiResponse, ApiTags } from "@nestjs/swagger";
import { InjectRepository } from "@nestjs/typeorm";
import { Request, Response } from "express";
import { contentDispositionFilename } from "src/helpers/sanitizefilename";
import { AcController, AcLinks } from "src/access-control/access-control-lib";
import { AuthUser } from "src/auth/decorators/auth-user.decorator";
import { Authenticated } from "src/auth/decorators/authenticated.decorator";
import { SessionUser } from "src/auth/schema/user-token";
import { Event } from "src/models/events/entities/event.entity";
import { EventsRepository } from "src/models/events/repositories/events.repository";
import { EventAnnouncementService } from "src/models/events/services/event-announcement.service";
import { UsersRepository } from "src/models/users/repositories/users.repository";
import { Repository } from "typeorm";
import {
	EventAnnouncementCheckPermission,
	EventAnnouncementGetPermission,
	EventAnnouncementSendPermission,
	EventAnnouncementSentPermission,
	EventAnnouncementUnsentPermission,
} from "../acl/events.acl";
import { EventAnnouncementCheckResponse, EventAnnouncementSendResponse } from "../dto/event-announcement.dto";

@Controller("events")
@Authenticated()
@AcController()
@ApiTags("Events")
export class EventsAnnouncementController {
	constructor(
		private readonly events: EventsRepository,
		@InjectRepository(Event) private readonly eventsRepository: Repository<Event>,
		private readonly eventAnnouncementService: EventAnnouncementService,
		private readonly users: UsersRepository,
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
		const event = await this.getAnnouncementEvent(eventId);

		EventAnnouncementGetPermission.canOrThrow(req, event);

		const { fileBuffer, fileName } = await this.eventAnnouncementService.generateAnnouncement(event);

		res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");

		res.setHeader("Content-Disposition", `attachment; ${contentDispositionFilename(fileName)}`);
		res.setHeader("Access-Control-Expose-Headers", "Content-Disposition");

		return new StreamableFile(fileBuffer);
	}

	@Get(":eventId/announcement/check")
	@AcLinks(EventAnnouncementCheckPermission)
	@ApiResponse({ status: 200, type: EventAnnouncementCheckResponse })
	async checkEventAnnouncement(
		@Req() req: Request,
		@Param("eventId", ParseIntPipe) eventId: number,
	): Promise<EventAnnouncementCheckResponse> {
		const event = await this.getAnnouncementEvent(eventId);

		EventAnnouncementCheckPermission.canOrThrow(req, event);

		return {
			recipient: this.eventAnnouncementService.recipient,
			missing: this.eventAnnouncementService.getMissingData(event),
		};
	}

	@Post(":eventId/announcement/send")
	@HttpCode(200)
	@AcLinks(EventAnnouncementSendPermission)
	@ApiResponse({ status: 200, type: EventAnnouncementSendResponse })
	async sendEventAnnouncement(
		@Req() req: Request,
		@AuthUser() authUser: SessionUser,
		@Param("eventId", ParseIntPipe) eventId: number,
	): Promise<EventAnnouncementSendResponse> {
		const event = await this.getAnnouncementEvent(eventId);

		EventAnnouncementSendPermission.canOrThrow(req, event);

		if (!event.attendees?.length) throw new UnprocessableEntityException("Akce nemá žádné účastníky.");

		const missing = this.eventAnnouncementService.getMissingData(event);
		if (missing.length) throw new UnprocessableEntityException("V ohlášce chybí údaje účastníků.");

		const user = await this.users.getUser(authUser.userId, { includeMember: true });
		const sender = user?.member?.nickname || user?.login || "Někdo";

		await this.eventAnnouncementService.sendAnnouncement(event, { sender, replyTo: user?.email });

		const sentAt = new Date();
		await this.events.updateEvent(eventId, { announcementSentAt: sentAt });

		return { recipient: this.eventAnnouncementService.recipient, sentAt };
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

	private async getAnnouncementEvent(eventId: number) {
		const event = await this.eventsRepository.findOne({
			where: { id: eventId },
			relations: { attendees: { member: { contacts: true } } },
		});

		if (!event) throw new NotFoundException();

		return event;
	}
}
