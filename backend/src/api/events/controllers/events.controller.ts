import { Body, Controller, Delete, Get, HttpCode, NotFoundException, Param, Patch, Post, Req } from "@nestjs/common";
import { ApiResponse, ApiTags } from "@nestjs/swagger";
import { InjectRepository } from "@nestjs/typeorm";
import { Request } from "express";
import { AcController } from "src/access-control/decorators/ac-controller.decorator";
import { AcLinks } from "src/access-control/decorators/ac-links.decorator";
import { AccessControlService } from "src/access-control/services/access-control.service";
import { MemberACL } from "src/api/members/acl/members.acl";
import { Event } from "src/models/events/entities/event.entity";
import { EventWithLeaders } from "src/models/events/schema/event-with-leaders";
import { EventsService } from "src/models/events/services/events.service";
import { Repository } from "typeorm";
import {
  EventACL,
  EventAttendeesACL,
  EventCreateACL,
  EventDeleteACL,
  EventsACL,
  EventUpdateACL,
} from "../acl/events.acl";
import { EventAttendeeResponse } from "../dto/event-attendee.dto";
import { EventCreateBody, EventCreateResponse, EventResponse, EventUpdateBody } from "../dto/event.dto";

@Controller("events")
@AcController()
@ApiTags("Events")
export class EventsController {
  constructor(
    private ac: AccessControlService,
    private events: EventsService,
    @InjectRepository(Event) private eventsRepository: Repository<Event>,
  ) {}

  @Get()
  @AcLinks(EventsACL, { contains: { array: { entity: EventACL } } })
  @ApiResponse({ type: EventResponse, isArray: true })
  async listEvents(@Req() req: Request): Promise<EventResponse[]> {
    this.ac.canOrThrow(EventsACL, undefined, req);

    return <Promise<EventWithLeaders[]>>(
      this.eventsRepository
        .createQueryBuilder("events")
        .leftJoin("events.attendees", "attendees", "attendees.type = 'leader'")
        .leftJoinAndSelect("attendees.member", "leaders")
        .getMany()
    );
  }

  @Post("")
  @HttpCode(201)
  @AcLinks(EventCreateACL)
  @ApiResponse({ status: 201, type: EventCreateResponse })
  async createEvent(@Req() req: Request, @Body() body: EventCreateBody): Promise<EventCreateResponse> {
    this.ac.canOrThrow(EventCreateACL, undefined, req);

    return this.events.createEvent(body);
  }

  @Patch(":id")
  @HttpCode(204)
  @AcLinks(EventUpdateACL, { path: (e) => e.id })
  @ApiResponse({ status: 204 })
  async updateEvent(@Req() req: Request, @Param("id") id: number, @Body() body: EventUpdateBody): Promise<void> {
    const event = await this.events.getEvent(id, { leaders: true });
    if (!event) throw new NotFoundException();

    this.ac.canOrThrow(EventUpdateACL, event, req);

    this.events.updateEvent(id, body);
  }

  @Delete(":id")
  @HttpCode(204)
  @AcLinks(EventDeleteACL, { path: (e) => e.id })
  @ApiResponse({ status: 204 })
  async deleteEvent(@Req() req: Request, @Param("id") id: number): Promise<void> {
    const event = await this.events.getEvent(id, { leaders: true });
    if (!event) throw new NotFoundException();

    this.ac.canOrThrow(EventDeleteACL, event, req);

    return this.events.deleteEvent(id);
  }

  @Get(":id")
  @AcLinks(EventACL, { path: (doc) => `${doc.id}` })
  @ApiResponse({ type: EventResponse })
  async getEvent(@Req() req: Request, @Param("id") id: number): Promise<EventResponse> {
    const event = await this.events.getEvent(id, { leaders: true });
    if (!event) throw new NotFoundException();

    this.ac.canOrThrow(EventACL, event, req);

    return event;
  }

  @Get(":id/attendees")
  @AcLinks(EventAttendeesACL, { path: (e) => `${e.id}/attendees`, contains: { array: { entity: MemberACL } } })
  @ApiResponse({ type: EventAttendeeResponse })
  async getEventAttendees(@Req() req: Request, @Param("id") id: number): Promise<EventAttendeeResponse[]> {
    const event = await this.events.getEvent(id, { select: { id: true, status: true } });
    if (!event) throw new NotFoundException();

    this.ac.canOrThrow(EventAttendeesACL, event, req);

    return this.events.getEventAttendees(id);
    if (!event) throw new NotFoundException();

    return event.attendees?.map((a) => a.member!) ?? [];
  }
}
