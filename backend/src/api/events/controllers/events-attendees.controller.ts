import { Body, Controller, Delete, Get, NotFoundException, Param, Patch, Put, Req } from "@nestjs/common";
import { ApiResponse, ApiTags } from "@nestjs/swagger";
import { Request } from "express";
import { AcController, AcLinks, WithLinks } from "src/access-control/access-control-lib";
import { EventsRepository } from "src/models/events/repositories/events.repository";

import {
	EventAttendeeCreatePermission,
	EventAttendeeDeletePermission,
	EventAttendeeEditPermission,
	EventAttendeesListPermission,
} from "../acl/events.acl";
import { EventAttendeeCreateBody, EventAttendeeResponse, EventAttendeeUpdateBody } from "../dto/event-attendee.dto";

@Controller("events")
@AcController()
@ApiTags("Events")
export class EventsAttendeesController {
	constructor(private events: EventsRepository) {}

	@Get(":eventId/attendees")
	@AcLinks(EventAttendeesListPermission)
	@ApiResponse({ status: 200, type: WithLinks(EventAttendeeResponse), isArray: true })
	async listEventAttendees(@Req() req: Request, @Param("eventId") eventId: number): Promise<EventAttendeeResponse[]> {
		const event = await this.events.getEvent(eventId);
		if (!event) throw new NotFoundException();

		EventAttendeesListPermission.canOrThrow(req, event);

		return this.events.getEventAttendees(eventId);
	}

	@Put(":eventId/attendees/:memberId")
	@AcLinks(EventAttendeeCreatePermission)
	@ApiResponse({ status: 204 })
	async addEventAttendee(
		@Req() req: Request,
		@Param("eventId") eventId: number,
		@Param("memberId") memberId: number,
		@Body() body: EventAttendeeCreateBody,
	) {
		const event = await this.events.getEvent(eventId);
		if (!event) throw new NotFoundException();

		EventAttendeeCreatePermission.canOrThrow(req, event);

		await this.events.createEventAttendee(eventId, memberId, body);
	}

	@Patch(":eventId/attendees/:memberId")
	@AcLinks(EventAttendeeEditPermission)
	@ApiResponse({ status: 204 })
	async updateEventAttendee(
		@Req() req: Request,
		@Param("eventId") eventId: number,
		@Param("memberId") memberId: number,
		@Body() body: EventAttendeeUpdateBody,
	) {
		const eventAttendee = await this.events.getEventAttendee(eventId, memberId);
		if (!eventAttendee) throw new NotFoundException();

		EventAttendeeEditPermission.canOrThrow(req, eventAttendee);

		eventAttendee.type = body.type;

		await this.events.updateEventAttendee(eventId, memberId, body);
	}

	@Delete(":eventId/attendees/:memberId")
	@AcLinks(EventAttendeeDeletePermission)
	@ApiResponse({ status: 204 })
	async deleteEventAttendee(
		@Req() req: Request,
		@Param("eventId") eventId: number,
		@Param("memberId") memberId: number,
	) {
		const eventAttendee = await this.events.getEventAttendee(eventId, memberId);
		if (!eventAttendee) throw new NotFoundException();

		EventAttendeeDeletePermission.canOrThrow(req, eventAttendee);

		await this.events.deleteEventAttendee(eventId, memberId);
	}
}
