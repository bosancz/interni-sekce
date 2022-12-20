import { Controller, Get, Req } from "@nestjs/common";
import { ApiResponse } from "@nestjs/swagger";
import { InjectRepository } from "@nestjs/typeorm";
import { Request } from "express";
import { AcController } from "src/access-control/decorators/ac-controller.decorator";
import { AcLinks } from "src/access-control/decorators/ac-links.decorator";
import { AccessControlService } from "src/access-control/services/access-control.service";
import { MemberACL } from "src/api/members/acl/members.acl";
import { Event } from "src/models/events/entities/event.entity";
import { acWhere } from "src/shared/util/ac-where";
import { Repository } from "typeorm";
import { EventACL, EventAttendeesACL, EventsACL } from "../acl/events.acl";
import { EventResponse } from "../dto/event-response.dto";

@Controller("events")
@AcController()
export class EventsController {
  constructor(private acl: AccessControlService, @InjectRepository(Event) private eventsRepository: Repository<Event>) {}

  @Get()
  @AcLinks(EventsACL, { contains: { array: { entity: EventACL } } })
  @ApiResponse({ type: EventResponse, isArray: true })
  async listEvents(@Req() req: Request): Promise<EventResponse[]> {
    this.acl.canOrThrow(EventsACL, undefined, req);

    const events = this.eventsRepository.createQueryBuilder().where(acWhere(this.acl, EventACL, req));

    return events.getMany();
  }

  @Get(":id")
  @AcLinks(EventACL, {
    path: (doc) => `${doc.id}`,
  })
  @ApiResponse({ type: EventResponse })
  async getEvent(@Req() req: Request): Promise<EventResponse> {
    const doc: Event = { id: 5 } as Event;
    // const where = this.acl.filter("event", user);

    this.acl.canOrThrow(EventACL, doc, req);

    return <any>doc;
  }

  @Get(":id/attendees")
  @AcLinks(EventAttendeesACL, { path: (e) => `${e.id}/attendees`, contains: { array: { entity: MemberACL } } })
  async getEventAttendees() {
    return [];
  }
}
