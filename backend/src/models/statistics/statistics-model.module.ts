import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { EventAttendee } from "../events/entities/event-attendee.entity";
import { Event } from "../events/entities/event.entity";
import { Member } from "../members/entities/member.entity";
import { ChildrenStatisticsService } from "./services/children-statistics.service";
import { EventsRankingStatisticsService } from "./services/events-ranking-statistics.service";
import { LeadersStatisticsService } from "./services/leaders-statistics.service";
import { PaddlersStatisticsService } from "./services/paddlers-statistics.service";

@Module({
	providers: [
		PaddlersStatisticsService,
		LeadersStatisticsService,
		EventsRankingStatisticsService,
		ChildrenStatisticsService,
	],
	imports: [TypeOrmModule.forFeature([Member, Event, EventAttendee])],
	exports: [
		PaddlersStatisticsService,
		LeadersStatisticsService,
		EventsRankingStatisticsService,
		ChildrenStatisticsService,
	],
})
export class StatisticsModelModule {}
