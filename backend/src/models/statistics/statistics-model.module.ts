import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { EventAttendee } from "../events/entities/event-attendee.entity";
import { Event } from "../events/entities/event.entity";
import { Member } from "../members/entities/member.entity";
import { LeadersStatisticsService } from "./services/leaders-statistics.service";
import { PaddlersStatisticsService } from "./services/paddlers-statistics.service";

@Module({
	providers: [PaddlersStatisticsService, LeadersStatisticsService],
	imports: [TypeOrmModule.forFeature([Member, Event, EventAttendee])],
	exports: [PaddlersStatisticsService, LeadersStatisticsService],
})
export class StatisticsModelModule {}
