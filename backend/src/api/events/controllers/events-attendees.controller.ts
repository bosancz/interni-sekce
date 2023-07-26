import { Body, Controller, Delete, Get, NotFoundException, Param, Patch, Put, Req } from "@nestjs/common";
import { ApiResponse, ApiTags } from "@nestjs/swagger";
import { Request } from "express";
import { AcController, AcLinks, WithLinks } from "src/access-control/access-control-lib";
import { EventsService } from "src/models/events/services/events.service";
import {
  EventAttendeeCreateRoute,
  EventAttendeeDeleteRoute,
  EventAttendeeEditRoute,
  EventAttendeesListRoute,
} from "../acl/event-attendees.acl";

import { EventAttendeeCreateBody, EventAttendeeResponse, EventAttendeeUpdateBody } from "../dto/event-attendee.dto";

@Controller("events")
@AcController()
@ApiTags("Events")
export class EventsAttendeesController {
  constructor(private events: EventsService) {}

  @Get(":eventId/attendees")
  @AcLinks(EventAttendeesListRoute)
  @ApiResponse({ type: WithLinks(EventAttendeeResponse) })
  async listEventAttendees(@Req() req: Request, @Param("eventId") eventId: number): Promise<EventAttendeeResponse[]> {
    const event = await this.events.getEvent(eventId);
    if (!event) throw new NotFoundException();

    EventAttendeesListRoute.canOrThrow(req, event);

    return this.events.getEventAttendees(eventId);
  }

  @Put(":eventId/attendees/:memberId")
  @AcLinks(EventAttendeeCreateRoute)
  @ApiResponse({ status: 204 })
  async addEventAttendee(
    @Req() req: Request,
    @Param("eventId") eventId: number,
    @Param("memberId") memberId: number,
    @Body() body: EventAttendeeCreateBody,
  ) {
    const event = await this.events.getEvent(eventId);
    if (!event) throw new NotFoundException();

    EventAttendeeCreateRoute.canOrThrow(req, event);

    await this.events.createEventAttendee(eventId, memberId, body);
  }

  @Patch(":eventId/attendees/:memberId")
  @AcLinks(EventAttendeeEditRoute)
  @ApiResponse({ status: 204 })
  async updateEventAttendee(
    @Req() req: Request,
    @Param("eventId") eventId: number,
    @Param("memberId") memberId: number,
    @Body() body: EventAttendeeUpdateBody,
  ) {
    const eventAttendee = await this.events.getEventAttendee(eventId, memberId);
    if (!eventAttendee) throw new NotFoundException();

    EventAttendeeEditRoute.canOrThrow(req, eventAttendee);

    eventAttendee.type = body.type;

    await this.events.updateEventAttendee(eventId, memberId, body);
  }

  @Delete(":eventId/attendees/:memberId")
  @AcLinks(EventAttendeeDeleteRoute)
  @ApiResponse({ status: 204 })
  async deleteEventAttendee(
    @Req() req: Request,
    @Param("eventId") eventId: number,
    @Param("memberId") memberId: number,
  ) {
    const eventAttendee = await this.events.getEventAttendee(eventId, memberId);
    if (!eventAttendee) throw new NotFoundException();

    EventAttendeeDeleteRoute.canOrThrow(req, eventAttendee);

    await this.events.deleteEventAttendee(eventId, memberId);
  }
}
