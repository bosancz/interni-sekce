import { Body, Controller, Delete, Get, NotFoundException, Param, Put, Req } from "@nestjs/common";
import { ApiResponse, ApiTags } from "@nestjs/swagger";
import { Request } from "express";
import { AcController } from "src/access-control/access-control-lib/decorators/ac-controller.decorator";
import { AcLinks } from "src/access-control/access-control-lib/decorators/ac-links.decorator";
import { AccessControlService } from "src/access-control/access-control-lib/services/access-control.service";
import { MemberACL } from "src/api/members/acl/members.acl";
import { EventsService } from "src/models/events/services/events.service";
import { EventAttendeeACL, EventAttendeesDeleteACL, EventAttendeesEditACL } from "../acl/event-attendee.acl";
import { EventACL, EventAttendeesACL } from "../acl/events.acl";

import { EventAttendeeResponse, EventAttendeeUpdateBody } from "../dto/event-attendee.dto";

@Controller("events")
@AcController()
@ApiTags("Events")
export class EventsAttendeesController {
  constructor(private ac: AccessControlService, private events: EventsService) {}

  @Get(":id/attendees")
  @AcLinks(EventAttendeesACL, {
    path: (e) => `${e.id}/attendees`,
    contains: {
      array: { entity: EventAttendeeACL, properties: { member: { entity: MemberACL }, event: { entity: EventACL } } },
    },
  })
  @ApiResponse({ type: EventAttendeeResponse })
  async eventAttendeesList(@Req() req: Request, @Param("id") id: number): Promise<EventAttendeeResponse[]> {
    const event = await this.events.getEvent(id);
    if (!event) throw new NotFoundException();

    this.ac.canOrThrow(EventAttendeesACL, event, req);

    return this.events.getEventAttendees(id);
  }

  @Put(":id/attendees/:memberId")
  @AcLinks(EventAttendeesEditACL, {
    path: (d) => `${d.eventId}/attendees/${d.memberId}`,
    contains: { array: { entity: MemberACL } },
  })
  @ApiResponse({ status: 204 })
  async eventAttendeeEdit(
    @Req() req: Request,
    @Param("id") eventId: number,
    @Param("memberId") memberId: number,
    @Body() body: EventAttendeeUpdateBody,
  ) {
    const eventAttendee = await this.events.getEventAttendee(eventId, memberId);
    if (!eventAttendee) throw new NotFoundException();

    this.ac.canOrThrow(EventAttendeesEditACL, eventAttendee, req);

    eventAttendee.type = body.type;

    await this.events.updateEventAttendee(eventAttendee);
  }

  @Delete(":id/attendees/:memberId")
  @AcLinks(EventAttendeesDeleteACL, { path: (e) => `${e.eventId}/attendees/${e.memberId}` })
  @ApiResponse({ status: 204 })
  async eventAttendeeDelete(@Req() req: Request, @Param("id") eventId: number, @Param("memberId") memberId: number) {
    const eventAttendee = await this.events.getEventAttendee(eventId, memberId);
    if (!eventAttendee) throw new NotFoundException();

    this.ac.canOrThrow(EventAttendeesDeleteACL, eventAttendee, req);

    await this.events.deleteEventAttendee(eventId, memberId);
  }
}
