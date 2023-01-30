import { Body, Controller, Delete, Get, NotFoundException, Param, Put, Req } from "@nestjs/common";
import { ApiResponse, ApiTags } from "@nestjs/swagger";
import { Request } from "express";
import { AcController } from "src/access-control/access-control-lib/decorators/ac-controller.decorator";
import { AcLinks } from "src/access-control/access-control-lib/decorators/ac-links.decorator";
import { EventsService } from "src/models/events/services/events.service";
import { EventAttendeeDeleteRoute, EventAttendeeEditRoute, EventAttendeesListRoute } from "../acl/event-attendees.acl";

import { EventAttendeeResponse, EventAttendeeUpdateBody } from "../dto/event-attendee.dto";

@Controller("events")
@AcController()
@ApiTags("Events")
export class EventsAttendeesController {
  constructor(private events: EventsService) {}

  @Get(":id/attendees")
  @AcLinks(EventAttendeesListRoute)
  @ApiResponse({ type: EventAttendeeResponse })
  async eventAttendeesList(@Req() req: Request, @Param("id") id: number): Promise<EventAttendeeResponse[]> {
    const event = await this.events.getEvent(id);
    if (!event) throw new NotFoundException();

    EventAttendeesListRoute.canOrThrow(req, event);

    return this.events.getEventAttendees(id);
  }

  @Put(":id/attendees/:memberId")
  @AcLinks(EventAttendeeEditRoute)
  @ApiResponse({ status: 204 })
  async eventAttendeeEdit(
    @Req() req: Request,
    @Param("id") eventId: number,
    @Param("memberId") memberId: number,
    @Body() body: EventAttendeeUpdateBody,
  ) {
    const eventAttendee = await this.events.getEventAttendee(eventId, memberId);
    if (!eventAttendee) throw new NotFoundException();

    EventAttendeeEditRoute.canOrThrow(req, eventAttendee);

    eventAttendee.type = body.type;

    await this.events.updateEventAttendee(eventAttendee);
  }

  @Delete(":id/attendees/:memberId")
  @AcLinks(EventAttendeeDeleteRoute)
  @ApiResponse({ status: 204 })
  async eventAttendeeDelete(@Req() req: Request, @Param("id") eventId: number, @Param("memberId") memberId: number) {
    const eventAttendee = await this.events.getEventAttendee(eventId, memberId);
    if (!eventAttendee) throw new NotFoundException();

    EventAttendeeDeleteRoute.canOrThrow(req, eventAttendee);

    await this.events.deleteEventAttendee(eventId, memberId);
  }
}
