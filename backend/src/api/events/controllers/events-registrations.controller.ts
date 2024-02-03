import {
  Controller,
  Delete,
  Get,
  HttpCode,
  NotFoundException,
  Param,
  Put,
  Req,
  UploadedFile,
  UseInterceptors,
} from "@nestjs/common";
import { FileInterceptor } from "@nestjs/platform-express";
import { ApiBody, ApiResponse, ApiTags } from "@nestjs/swagger";
import { InjectRepository } from "@nestjs/typeorm";
import { Request } from "express";
import { AcController, AcLinks } from "src/access-control/access-control-lib";
import { Event } from "src/models/events/entities/event.entity";
import { EventsRepository } from "src/models/events/repositories/events.repository";
import { Repository } from "typeorm";
import { EventRegistrationDeleteRoute } from "../acl/event-registration.acl";
import { EventRegistrationEditRoute, EventRegistrationReadRoute } from "../acl/events.acl";

@Controller("events")
@AcController()
@ApiTags("Events")
export class EventsRegistrationsController {
  constructor(
    private events: EventsRepository,
    @InjectRepository(Event) private eventsRepository: Repository<Event>,
  ) {}

  @Get(":id/registration")
  @AcLinks(EventRegistrationReadRoute)
  async getEventRegistration(@Req() req: Request, @Param("id") id: number): Promise<void> {
    const event = await this.events.getEvent(id);
    if (!event) throw new NotFoundException();

    EventRegistrationReadRoute.canOrThrow(req, event);
    // TODO:
  }

  @Put(":id/registration")
  @HttpCode(204)
  @AcLinks(EventRegistrationEditRoute)
  @ApiResponse({ status: 204 })
  @UseInterceptors(FileInterceptor("file"))
  @ApiBody({
    schema: {
      type: "object",
      properties: {
        registration: {
          type: "string",
          format: "binary",
        },
      },
    },
  })
  async saveEventRegistration(
    @Req() req: Request,
    @Param("id") id: number,
    @UploadedFile("registration") registration: Express.Multer.File,
  ): Promise<void> {
    const event = await this.events.getEvent(id);
    if (!event) throw new NotFoundException();

    EventRegistrationEditRoute.canOrThrow(req, event);
    // TODO:
  }

  @Delete(":id/registration")
  @AcLinks(EventRegistrationDeleteRoute)
  async deleteEventRegistration(@Req() req: Request, @Param("id") id: number): Promise<void> {
    const event = await this.events.getEvent(id);
    if (!event) throw new NotFoundException();

    EventRegistrationDeleteRoute.canOrThrow(req, event);
    // TODO:
  }
}
