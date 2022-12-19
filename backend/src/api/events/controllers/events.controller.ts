import { Controller, Get } from "@nestjs/common";
import { ApiResponse } from "@nestjs/swagger";
import { AcController } from "src/models/access-control/decorators/ac-controller.decorator";
import { AcEntity } from "src/models/access-control/decorators/ac-entity.decorator";
import { EventResponseDto } from "../dto/event-response.dto";

@Controller("events")
@AcController()
export class EventsController {
  constructor() {}

  @Get()
  @AcEntity("event")
  @ApiResponse({ type: EventResponseDto, isArray: true })
  async listEvents(): Promise<EventResponseDto[]> {
    // const where: FindOptionsWhere<Event> = this.acService.getFilter("event", Roles.clen, {});

    return [{ id: 1 }, { id: 5 }];
  }

  @Get("attendees")
  @AcEntity("event:attendees")
  async getEventAttendees(): Promise<EventResponseDto[]> {
    return [];
  }
}
