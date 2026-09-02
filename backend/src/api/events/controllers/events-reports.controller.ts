import { Body, Controller, Get, HttpCode, NotFoundException, Param, ParseIntPipe, Put, Req } from "@nestjs/common";
import { ApiResponse, ApiTags } from "@nestjs/swagger";
import { InjectRepository } from "@nestjs/typeorm";
import { Request } from "express";
import { AcController, AcLinks } from "src/access-control/access-control-lib";
import { Authenticated } from "src/auth/decorators/authenticated.decorator";
import { Event } from "src/models/events/entities/event.entity";
import { EventsRepository } from "src/models/events/repositories/events.repository";
import { Repository } from "typeorm";
import { EventReportEditPermission, EventReportReadPermission } from "../acl/events.acl";
import { EventReportUpdateBody } from "../dto/event.dto";

@Controller("events")
@Authenticated()
@AcController()
@ApiTags("Events")
export class EventsReportsController {
	constructor(
		private events: EventsRepository,
		@InjectRepository(Event) private eventsRepository: Repository<Event>,
	) {}

	@Get(":eventId/report")
	@HttpCode(204)
	@AcLinks(EventReportReadPermission)
	@ApiResponse({ status: 204 })
	async getEventReport(@Req() req: Request, @Param("eventId", ParseIntPipe) eventId: number): Promise<void> {
		const event = await this.events.getEvent(eventId);
		if (!event) throw new NotFoundException();

		EventReportReadPermission.canOrThrow(req, event);
		// TODO:
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

		await this.events.updateEvent(eventId, { report: body.report });
	}
}
