import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Logger,
  NotFoundException,
  Param,
  Patch,
  Post,
  Req,
  Res,
} from "@nestjs/common";
import { ApiResponse, ApiTags } from "@nestjs/swagger";
import { InjectRepository } from "@nestjs/typeorm";
import { Request, Response } from "express";
import { AcController } from "src/access-control/access-control-lib/decorators/ac-controller.decorator";
import { AcLinks } from "src/access-control/access-control-lib/decorators/ac-links.decorator";
import { Event, EventStatus } from "src/models/events/entities/event.entity";
import { EventsService } from "src/models/events/services/events.service";
import { Repository } from "typeorm";
import {
  EventCancelRoute,
  EventCreateRoute,
  EventDeleteRoute,
  EventEditRoute,
  EventPublishRoute,
  EventReadRoute,
  EventRejectRoute,
  EventSubmitRoute,
  EventUncancelRoute,
  EventUnpublishRoute,
  EventsListRoute,
} from "../acl/events.acl";
import { EventCreateBody, EventResponse, EventStatusChangeBody, EventUpdateBody } from "../dto/event.dto";

@Controller("events")
@AcController()
@ApiTags("Events")
export class EventsController {
  private logger = new Logger(EventsController.name);

  constructor(private events: EventsService, @InjectRepository(Event) private eventsRepository: Repository<Event>) {}

  @Get()
  @AcLinks(EventsListRoute)
  @ApiResponse({ type: EventResponse, isArray: true })
  async listEvents(@Req() req: Request): Promise<Omit<EventResponse, "_links">[]> {
    const q = this.eventsRepository
      .createQueryBuilder("events")
      .select(["events.id", "events.name", "events.status"])
      .where(EventsListRoute.canWhere(req))
      .limit(25);

    return q.getMany();
  }

  @Post()
  @AcLinks(EventCreateRoute)
  @ApiResponse({ status: 201, type: EventResponse })
  async createEvent(
    @Req() req: Request,
    @Body() body: EventCreateBody,
    @Res({ passthrough: true }) res: Response,
  ): Promise<Omit<EventResponse, "_links">> {
    EventCreateRoute.canOrThrow(req, body);

    res.status(201);
    return this.events.createEvent(body);
  }

  @Get(":id")
  @AcLinks(EventReadRoute)
  @ApiResponse({ type: EventResponse })
  async getEvent(@Req() req: Request, @Param("id") id: number): Promise<Omit<EventResponse, "_links">> {
    const event = await this.events.getEvent(id, { leaders: true });
    if (!event) throw new NotFoundException();

    EventReadRoute.canOrThrow(req, event);

    return event;
  }

  @Patch(":id")
  @HttpCode(204)
  @AcLinks(EventEditRoute)
  @ApiResponse({ status: 204 })
  async updateEvent(@Req() req: Request, @Param("id") id: number, @Body() body: EventUpdateBody): Promise<void> {
    const event = await this.events.getEvent(id, { leaders: true });
    if (!event) throw new NotFoundException();

    EventEditRoute.canOrThrow(req, event);

    await this.events.updateEvent(id, body);
  }

  @Delete(":id")
  @HttpCode(204)
  @AcLinks(EventDeleteRoute)
  @ApiResponse({ status: 204 })
  async deleteEvent(@Req() req: Request, @Param("id") id: number): Promise<void> {
    const event = await this.events.getEvent(id, { leaders: true });
    if (!event) throw new NotFoundException();

    EventDeleteRoute.canOrThrow(req, event);

    return this.events.deleteEvent(id);
  }

  @Post(":id/submit")
  @HttpCode(204)
  @AcLinks(EventSubmitRoute)
  @ApiResponse({ status: 204 })
  async submitEvent(@Req() req: Request, @Param("id") id: number, @Body() body: EventStatusChangeBody): Promise<void> {
    const event = await this.events.getEvent(id, { leaders: true });
    if (!event) throw new NotFoundException();

    EventSubmitRoute.canOrThrow(req, event);

    await this.events.updateEvent(id, { status: EventStatus.pending, statusNote: body.statusNote });
  }

  @Post(":id/reject")
  @HttpCode(204)
  @AcLinks(EventRejectRoute)
  @ApiResponse({ status: 204 })
  async rejectEvent(@Req() req: Request, @Param("id") id: number, @Body() body: EventStatusChangeBody): Promise<void> {
    const event = await this.events.getEvent(id, { leaders: true });
    if (!event) throw new NotFoundException();

    EventRejectRoute.canOrThrow(req, event);

    await this.events.updateEvent(id, { status: EventStatus.draft, statusNote: body.statusNote });
  }

  @Post(":id/publish")
  @HttpCode(204)
  @AcLinks(EventPublishRoute)
  @ApiResponse({ status: 204 })
  async publishEvent(@Req() req: Request, @Param("id") id: number, @Body() body: EventStatusChangeBody): Promise<void> {
    const event = await this.events.getEvent(id, { leaders: true });
    if (!event) throw new NotFoundException();

    EventRejectRoute.canOrThrow(req, event);

    await this.events.updateEvent(id, { status: EventStatus.draft, statusNote: body.statusNote });
  }

  @Post(":id/unpublish")
  @HttpCode(204)
  @AcLinks(EventUnpublishRoute)
  @ApiResponse({ status: 204 })
  async unpublishEvent(
    @Req() req: Request,
    @Param("id") id: number,
    @Body() body: EventStatusChangeBody,
  ): Promise<void> {
    const event = await this.events.getEvent(id, { leaders: true });
    if (!event) throw new NotFoundException();

    EventRejectRoute.canOrThrow(req, event);

    await this.events.updateEvent(id, { status: EventStatus.draft, statusNote: body.statusNote });
  }

  @Post(":id/cancel")
  @HttpCode(204)
  @AcLinks(EventCancelRoute)
  @ApiResponse({ status: 204 })
  async cancelEvent(@Req() req: Request, @Param("id") id: number, @Body() body: EventStatusChangeBody): Promise<void> {
    const event = await this.events.getEvent(id, { leaders: true });
    if (!event) throw new NotFoundException();

    EventRejectRoute.canOrThrow(req, event);

    await this.events.updateEvent(id, { status: EventStatus.draft, statusNote: body.statusNote });
  }

  @Post(":id/uncancel")
  @HttpCode(204)
  @AcLinks(EventUncancelRoute)
  @ApiResponse({ status: 204 })
  async uncancelEvent(
    @Req() req: Request,
    @Param("id") id: number,
    @Body() body: EventStatusChangeBody,
  ): Promise<void> {
    const event = await this.events.getEvent(id, { leaders: true });
    if (!event) throw new NotFoundException();

    EventRejectRoute.canOrThrow(req, event);

    await this.events.updateEvent(id, { status: EventStatus.draft, statusNote: body.statusNote });
  }
}