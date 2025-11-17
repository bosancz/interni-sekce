import { Controller, Get, HttpCode, NotFoundException, Param, Req, StreamableFile, Res} from "@nestjs/common";
import { ApiResponse, ApiTags } from "@nestjs/swagger";
import { InjectRepository } from "@nestjs/typeorm";
import { Request, Response} from "express";
import { AcController, AcLinks } from "src/access-control/access-control-lib";
import { Event } from "src/models/events/entities/event.entity";
import { EventsRepository } from "src/models/events/repositories/events.repository";
import { Repository } from "typeorm";
import { EventAccountingGetPermission } from "../acl/events.acl";
import { EventAccountingService } from "../providers/event-accountig.service";

@Controller("events")
@AcController()
@ApiTags("Events")
export class EventsAccountingController {
    constructor(
        private events: EventsRepository,
        @InjectRepository(Event) private eventsRepository: Repository<Event>,
        private eventAccountingService: EventAccountingService,
    ) {}

    @Get(":id/accounting")
    @HttpCode(200)
    @AcLinks(EventAccountingGetPermission)
    @ApiResponse({ status: 200 })
    async getEventAccounting(
        @Req() req: Request,
        @Param("id") id: number,
        @Res({ passthrough: true }) res: Response, 
    ): Promise<StreamableFile> {
            
        //const event = await this.events.getEvent(id);

        const event = await this.eventsRepository.findOne({
        where: { id: id },
        relations: ['attendees', 'attendees.member', 'attendees.member.contacts', 'expenses'] // Important: load nested member relation
        });


        if (!event) throw new NotFoundException();

        EventAccountingGetPermission.canOrThrow(req, event);

        const { fileBuffer, fileName } = await this.eventAccountingService.generateAccounting(event);

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
