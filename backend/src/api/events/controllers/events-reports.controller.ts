import { Controller, Get, HttpCode, NotFoundException, Param, Req } from "@nestjs/common";
import { ApiResponse, ApiTags } from "@nestjs/swagger";
import { InjectRepository } from "@nestjs/typeorm";
import { Request } from "express";
import { AcController, AcLinks } from "src/access-control/access-control-lib";
import { Event } from "src/models/events/entities/event.entity";
import { EventsRepository } from "src/models/events/repositories/events.repository";
import { Repository } from "typeorm";
import { EventReportReadRoute } from "../acl/events.acl";

@Controller("events")
@AcController()
@ApiTags("Events")
export class EventsReportsController {
  constructor(
    private events: EventsRepository,
    @InjectRepository(Event) private eventsRepository: Repository<Event>,
  ) {}

  @Get(":id/report")
  @HttpCode(204)
  @AcLinks(EventReportReadRoute)
  @ApiResponse({ status: 204 })
  async getEventReport(@Req() req: Request, @Param("id") id: number): Promise<void> {
    const event = await this.events.getEvent(id);
    if (!event) throw new NotFoundException();

    EventReportReadRoute.canOrThrow(req, event);
    // TODO:
  }
}
