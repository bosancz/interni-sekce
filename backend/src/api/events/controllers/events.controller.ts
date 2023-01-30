import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
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
import { Event } from "src/models/events/entities/event.entity";
import { EventsService } from "src/models/events/services/events.service";
import { Repository } from "typeorm";
import { EventCreateRoute, EventDeleteRoute, EventEditRoute, EventReadRoute, EventsListRoute } from "../acl/events.acl";
import { EventCreateBody, EventResponse, EventUpdateBody } from "../dto/event.dto";

@Controller("events")
@AcController()
@ApiTags("Events")
export class EventsController {
  constructor(private events: EventsService, @InjectRepository(Event) private eventsRepository: Repository<Event>) {}

  @Get()
  @AcLinks(EventsListRoute)
  @ApiResponse({ type: EventResponse, isArray: true })
  async eventsList(@Req() req: Request): Promise<EventResponse[]> {
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
  async eventCreate(
    @Req() req: Request,
    @Body() body: EventCreateBody,
    @Res({ passthrough: true }) res: Response,
  ): Promise<EventResponse> {
    EventCreateRoute.canOrThrow(req, body);

    res.status(201);
    return this.events.createEvent(body);
  }

  @Get(":id")
  @AcLinks(EventReadRoute)
  @ApiResponse({ type: EventResponse })
  async eventRead(@Req() req: Request, @Param("id") id: number): Promise<EventResponse> {
    const event = await this.events.getEvent(id, { leaders: true });
    if (!event) throw new NotFoundException();

    EventReadRoute.canOrThrow(req, event);

    return event;
  }

  @Patch(":id")
  @HttpCode(204)
  @AcLinks(EventEditRoute)
  @ApiResponse({ status: 204 })
  async eventEdit(@Req() req: Request, @Param("id") id: number, @Body() body: EventUpdateBody): Promise<void> {
    const event = await this.events.getEvent(id, { leaders: true });
    if (!event) throw new NotFoundException();

    EventEditRoute.canOrThrow(req, event);

    this.events.updateEvent(id, body);
  }

  @Delete(":id")
  @HttpCode(204)
  @AcLinks(EventDeleteRoute)
  @ApiResponse({ status: 204 })
  async eventDelete(@Req() req: Request, @Param("id") id: number): Promise<void> {
    const event = await this.events.getEvent(id, { leaders: true });
    if (!event) throw new NotFoundException();

    EventDeleteRoute.canOrThrow(req, event);

    return this.events.deleteEvent(id);
  }
}
