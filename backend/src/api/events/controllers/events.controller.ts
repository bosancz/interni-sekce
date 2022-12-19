import { Controller, Get } from "@nestjs/common";
import { ApiResponse } from "@nestjs/swagger";
import { AcController } from "src/models/access-control/decorators/ac-controller.decorator";
import { AcEntity } from "src/models/access-control/decorators/ac-entity.decorator";
import { AccessControlService } from "src/models/access-control/services/access-control.service";
import { User } from "src/models/auth/decorators/user.decorator";
import { UserToken } from "src/models/auth/schema/user-token";
import { Event } from "src/models/database/entities/event.entity";
import { EventResponseDto } from "../dto/event-response.dto";

@Controller("events")
@AcController()
export class EventsController {
  constructor(private acl: AccessControlService) {}

  @Get()
  @AcEntity<Event>("events", { children: { entity: "event", isArray: true } })
  @ApiResponse({ type: EventResponseDto, isArray: true })
  async listEvents(@User() user: UserToken): Promise<EventResponseDto[]> {
    this.acl.canOrThrow("events", [], user);

    return [{ id: 2 }, { id: 5 }];
  }

  @Get(":id")
  @AcEntity<Event>("event", { path: (doc) => `${doc.id}`, children: { properties: { attendees: { entity: "member", isArray: true } } } })
  @ApiResponse({ type: EventResponseDto })
  async getEvent(@User() user: UserToken): Promise<EventResponseDto> {
    const doc: EventResponseDto = { id: 5, attendees: [{ id: 1 }] };
    const where = this.acl.filter("event", user);

    this.acl.canOrThrow("event", doc, user);

    return doc;
  }

  @Get("attendees")
  @AcEntity("event:attendees")
  async getEventAttendees(): Promise<EventResponseDto[]> {
    return [];
  }
}
