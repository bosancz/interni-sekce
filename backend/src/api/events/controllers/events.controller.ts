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
  Query,
  Req,
  Res,
} from "@nestjs/common";
import { ApiResponse, ApiTags } from "@nestjs/swagger";
import { Request, Response } from "express";
import { AcController, AcLinks, WithLinks } from "src/access-control/access-control-lib";
import { Token } from "src/auth/decorators/token.decorator";
import { TokenData } from "src/auth/schema/user-token";
import { EventAttendeeType } from "src/models/events/entities/event-attendee.entity";
import { EventStates } from "src/models/events/entities/event.entity";
import { EventsRepository, GetEventsOptions } from "src/models/events/repositories/events.repository";
import {
  EventCancelRoute,
  EventCreateRoute,
  EventDeleteRoute,
  EventEditRoute,
  EventLeadRoute,
  EventPublishRoute,
  EventReadRoute,
  EventRejectRoute,
  EventSubmitRoute,
  EventUncancelRoute,
  EventUnpublishRoute,
  EventsListRoute,
  EventsYearsRoute,
} from "../acl/events.acl";
import { EventCreateBody, EventResponse, EventStatusChangeBody, EventUpdateBody } from "../dto/event.dto";
import { ListEventsQuery } from "../dto/events.dto";

@Controller("events")
@AcController()
@ApiTags("Events")
export class EventsController {
  private logger = new Logger(EventsController.name);

  constructor(private events: EventsRepository) {}

  @Get()
  @AcLinks(EventsListRoute)
  @ApiResponse({ type: WithLinks(EventResponse), isArray: true })
  async listEvents(
    @Req() req: Request,
    @Token() token: TokenData,
    @Query() query: ListEventsQuery,
  ): Promise<EventResponse[]> {
    const options: GetEventsOptions = {
      limit: query.limit,
      offset: query.offset,
      year: query.year,
      status: query.status,
      search: query.search,
      userId: query.my ? token.userId : undefined,
      noleader: query.noleader,
    };

    // FIXME: add ACL logic

    return this.events.getEvents(options);
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

  @Get("years")
  @AcLinks(EventsYearsRoute)
  @ApiResponse({ schema: { type: "array", items: { type: "number" } } })
  async getEventsYears(@Req() req: Request): Promise<number[]> {
    EventsYearsRoute.canOrThrow(req, undefined);

    return this.events.getEventsYears();
  }

  @Get(":id")
  @AcLinks(EventReadRoute)
  @ApiResponse({ type: WithLinks(EventResponse) })
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

  @Post(":id/lead")
  @HttpCode(204)
  @AcLinks(EventLeadRoute)
  @ApiResponse({ status: 204 })
  async leadEvent(@Req() req: Request, @Param("id") id: number, @Token() token: TokenData): Promise<void> {
    const event = await this.events.getEvent(id, { leaders: true });
    if (!event) throw new NotFoundException();

    EventLeadRoute.canOrThrow(req, event);

    await this.events.createEventAttendee(id, token.userId, { type: EventAttendeeType.leader });
  }

  @Post(":id/submit")
  @HttpCode(204)
  @AcLinks(EventSubmitRoute)
  @ApiResponse({ status: 204 })
  async submitEvent(@Req() req: Request, @Param("id") id: number, @Body() body: EventStatusChangeBody): Promise<void> {
    const event = await this.events.getEvent(id, { leaders: true });
    if (!event) throw new NotFoundException();

    EventSubmitRoute.canOrThrow(req, event);

    await this.events.updateEvent(id, { status: EventStates.pending, statusNote: body.statusNote });
  }

  @Post(":id/reject")
  @HttpCode(204)
  @AcLinks(EventRejectRoute)
  @ApiResponse({ status: 204 })
  async rejectEvent(@Req() req: Request, @Param("id") id: number, @Body() body: EventStatusChangeBody): Promise<void> {
    const event = await this.events.getEvent(id, { leaders: true });
    if (!event) throw new NotFoundException();

    EventRejectRoute.canOrThrow(req, event);

    await this.events.updateEvent(id, { status: EventStates.draft, statusNote: body.statusNote });
  }

  @Post(":id/publish")
  @HttpCode(204)
  @AcLinks(EventPublishRoute)
  @ApiResponse({ status: 204 })
  async publishEvent(@Req() req: Request, @Param("id") id: number, @Body() body: EventStatusChangeBody): Promise<void> {
    const event = await this.events.getEvent(id, { leaders: true });
    if (!event) throw new NotFoundException();

    EventRejectRoute.canOrThrow(req, event);

    await this.events.updateEvent(id, { status: EventStates.draft, statusNote: body.statusNote });
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

    await this.events.updateEvent(id, { status: EventStates.draft, statusNote: body.statusNote });
  }

  @Post(":id/cancel")
  @HttpCode(204)
  @AcLinks(EventCancelRoute)
  @ApiResponse({ status: 204 })
  async cancelEvent(@Req() req: Request, @Param("id") id: number, @Body() body: EventStatusChangeBody): Promise<void> {
    const event = await this.events.getEvent(id, { leaders: true });
    if (!event) throw new NotFoundException();

    EventRejectRoute.canOrThrow(req, event);

    await this.events.updateEvent(id, { status: EventStates.draft, statusNote: body.statusNote });
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

    await this.events.updateEvent(id, { status: EventStates.draft, statusNote: body.statusNote });
  }
}
