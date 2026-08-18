import { Controller, Get, HttpCode, NotFoundException, Param, ParseIntPipe, Req, Res, StreamableFile } from "@nestjs/common";
import { ApiResponse, ApiTags } from "@nestjs/swagger";
import { InjectRepository } from "@nestjs/typeorm";
import { Request, Response } from "express";
import { AcController, AcLinks } from "src/access-control/access-control-lib";
import { Authenticated } from "src/auth/decorators/authenticated.decorator";
import { Event } from "src/models/events/entities/event.entity";
import { EventsRepository } from "src/models/events/repositories/events.repository";
import { EventAccountingService } from "src/models/events/services/event-accountig.service";
import { Repository } from "typeorm";
import { EventAccountingGetPermission } from "../acl/events.acl";

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
		//const event = await this.events.getEvent(eventId);

		const event = await this.eventsRepository.findOne({
			where: { id: eventId },
			relations: { attendees: { member: { contacts: true } }, expenses: true }, // Important: load nested member relation
		});

		if (!event) throw new NotFoundException();

		EventAccountingGetPermission.canOrThrow(req, event);

		const { fileBuffer, fileName } = await this.eventAccountingService.generateAccounting(event);

		res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");

		res.setHeader("Content-Disposition", `attachment; filename="${fileName}"`);
		res.setHeader("Access-Control-Expose-Headers", "Content-Disposition");

		return new StreamableFile(fileBuffer);
	}
}
