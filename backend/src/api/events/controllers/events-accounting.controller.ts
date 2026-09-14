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
import { contentDispositionFilename } from "src/helpers/sanitizefilename";
import { AcController, AcLinks } from "src/access-control/access-control-lib";
import { Authenticated } from "src/auth/decorators/authenticated.decorator";
import { Event } from "src/models/events/entities/event.entity";
import { EventsRepository } from "src/models/events/repositories/events.repository";
import { EventAccountingService } from "src/models/events/services/event-accountig.service";
import { Repository } from "typeorm";
import {
	EventAccountingGetPermission,
	EventAccountingSentPermission,
	EventAccountingUnsentPermission,
} from "../acl/events.acl";

@Controller("events")
@Authenticated()
@AcController()
@ApiTags("Events")
export class EventsAccountingController {
	constructor(
		private readonly events: EventsRepository,
		@InjectRepository(Event) private readonly eventsRepository: Repository<Event>,
		private readonly eventAccountingService: EventAccountingService,
	) {}

	@Get(":eventId/accounting")
	@HttpCode(200)
	@AcLinks(EventAccountingGetPermission)
	@ApiResponse({ status: 200 })
	async getEventAccounting(
		@Req() req: Request,
		@Param("eventId", ParseIntPipe) eventId: number,
		@Res({ passthrough: true }) res: Response,
	): Promise<StreamableFile> {
		const event = await this.eventsRepository.findOne({
			where: { id: eventId },
			relations: { attendees: { member: { contacts: true } }, expenses: true },
		});

		if (!event) throw new NotFoundException();

		EventAccountingGetPermission.canOrThrow(req, event);

		const { fileBuffer, fileName } = await this.eventAccountingService.generateAccounting(event);

		res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");

		res.setHeader("Content-Disposition", `attachment; ${contentDispositionFilename(fileName)}`);
		res.setHeader("Access-Control-Expose-Headers", "Content-Disposition");

		return new StreamableFile(fileBuffer);
	}

	@Post(":eventId/accounting/sent")
	@HttpCode(204)
	@AcLinks(EventAccountingSentPermission)
	@ApiResponse({ status: 204 })
	async markAccountingSent(@Req() req: Request, @Param("eventId", ParseIntPipe) eventId: number): Promise<void> {
		const event = await this.events.getEvent(eventId, { leaders: true });
		if (!event) throw new NotFoundException();

		EventAccountingSentPermission.canOrThrow(req, event);

		await this.events.updateEvent(eventId, { accountingSentAt: new Date() });
	}

	@Delete(":eventId/accounting/sent")
	@HttpCode(204)
	@AcLinks(EventAccountingUnsentPermission)
	@ApiResponse({ status: 204 })
	async unmarkAccountingSent(@Req() req: Request, @Param("eventId", ParseIntPipe) eventId: number): Promise<void> {
		const event = await this.events.getEvent(eventId, { leaders: true });
		if (!event) throw new NotFoundException();

		EventAccountingUnsentPermission.canOrThrow(req, event);

		await this.events.updateEvent(eventId, { accountingSentAt: null });
	}
}
