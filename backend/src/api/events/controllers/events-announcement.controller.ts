import { Controller, Get, HttpCode, NotFoundException, Param, Req, StreamableFile, Res} from "@nestjs/common";
import { ApiResponse, ApiTags } from "@nestjs/swagger";
import { InjectRepository } from "@nestjs/typeorm";
import { Request, Response} from "express";
import { AcController, AcLinks } from "src/access-control/access-control-lib";
import { Event } from "src/models/events/entities/event.entity";
import { EventsRepository } from "src/models/events/repositories/events.repository";
import { Repository } from "typeorm";
import { EventAnnouncementGetPermission } from "../acl/events.acl";
import { EventAnnouncementService } from "../providers/event-announcement.service";

@Controller("events")
@AcController()
@ApiTags("Events")
export class EventsAnnouncementController {
    constructor(
        private events: EventsRepository,
        @InjectRepository(Event) private eventsRepository: Repository<Event>,
        private eventAnnouncementService: EventAnnouncementService,
    ) {}

    @Get(":id/announcement")
    @HttpCode(200)
    @AcLinks(EventAnnouncementGetPermission)
    @ApiResponse({ status: 200 })
    async getEventAnnouncement(
        @Req() req: Request,
        @Param("id") id: number,
        @Res({ passthrough: true }) res: Response, 
    ): Promise<StreamableFile> {
            
        //const event = await this.events.getEvent(id);

        const event = await this.eventsRepository.findOne({
        where: { id: id },
        relations: ['attendees', 'attendees.member', 'attendees.member.contacts'] // Important: load nested member relation
        });


        if (!event) throw new NotFoundException();

        EventAnnouncementGetPermission.canOrThrow(req, event);

        const { fileBuffer, fileName } = await this.eventAnnouncementService.generateAnnouncement(event);

        res.setHeader(
            "Content-Type",
            "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        );

        res.setHeader(
            "Content-Disposition",
            `attachment; filename="${fileName}"`,
        );
        res.setHeader('Access-Control-Expose-Headers', 'Content-Disposition');

        
        return new StreamableFile(fileBuffer);


    }
}
