import { Body, Controller, Delete, Get, HttpCode, NotFoundException, Param, Patch, Post, Req } from "@nestjs/common";
import { ApiResponse, ApiTags } from "@nestjs/swagger";
import { InjectRepository } from "@nestjs/typeorm";
import { Request } from "express";
import { AcController } from "src/access-control/access-control-lib/decorators/ac-controller.decorator";
import { AcLinks } from "src/access-control/access-control-lib/decorators/ac-links.decorator";
import { AccessControlService } from "src/access-control/access-control-lib/services/access-control.service";
import { canWhere } from "src/access-control/util/can-where";
import { MemberACL } from "src/api/members/acl/members.acl";
import { Event } from "src/models/events/entities/event.entity";
import { EventsService } from "src/models/events/services/events.service";
import { Repository } from "typeorm";
import { EventACL, EventCreateACL, EventDeleteACL, EventsACL, EventUpdateACL } from "../acl/events.acl";
import { EventCreateBody, EventResponse, EventUpdateBody } from "../dto/event.dto";

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
  async eventsList(@Req() req: Request): Promise<EventResponse[]> {
    return this.eventsRepository.createQueryBuilder().where(canWhere(this.ac, EventsACL, req)).getMany();
  }

  @Post("")
  @HttpCode(201)
  @AcLinks(EventCreateACL)
  @ApiResponse({ status: 201, type: EventResponse })
  async eventCreate(@Req() req: Request, @Body() body: EventCreateBody): Promise<EventResponse> {
    this.ac.canOrThrow(EventCreateACL, undefined, req);

    return this.events.createEvent(body);
  }

  @Patch(":id")
  @HttpCode(204)
  @AcLinks(EventUpdateACL, { path: (e) => e.id })
  @ApiResponse({ status: 204 })
  async eventEdit(@Req() req: Request, @Param("id") id: number, @Body() body: EventUpdateBody): Promise<void> {
    const event = await this.events.getEvent(id, { leaders: true });
    if (!event) throw new NotFoundException();

    this.ac.canOrThrow(EventUpdateACL, event, req);

    this.events.updateEvent(id, body);
  }

  @Delete(":id")
  @HttpCode(204)
  @AcLinks(EventDeleteACL, { path: (e) => e.id })
  @ApiResponse({ status: 204 })
  async eventDelete(@Req() req: Request, @Param("id") id: number): Promise<void> {
    const event = await this.events.getEvent(id, { leaders: true });
    if (!event) throw new NotFoundException();

    this.ac.canOrThrow(EventDeleteACL, event, req);

    return this.events.deleteEvent(id);
  }

  @Get(":id")
  @AcLinks(EventACL, {
    path: (doc) => `${doc.id}`,
    contains: { properties: { leaders: { array: { entity: MemberACL } } } },
  })
  @ApiResponse({ type: EventResponse })
  async eventRead(@Req() req: Request, @Param("id") id: number): Promise<EventResponse> {
    const event = await this.events.getEvent(id, { leaders: true });
    if (!event) throw new NotFoundException();

    this.ac.canOrThrow(EventACL, event, req);

    return event;
  }
}
