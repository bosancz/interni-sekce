import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { EventAttendee } from "../events/entities/event-attendee.entity";
import { Event } from "../events/entities/event.entity";
import { Member } from "../members/entities/member.entity";
import { ChildrenStatisticsService } from "./services/children-statistics.service";
import { EventsRankingStatisticsService } from "./services/events-ranking-statistics.service";
import { LeadersStatisticsService } from "./services/leaders-statistics.service";
import { SummaryStatisticsService } from "./services/summary-statistics.service";

@Module({
	providers: [
		LeadersStatisticsService,
		EventsRankingStatisticsService,
		ChildrenStatisticsService,
		SummaryStatisticsService,
	],
	imports: [TypeOrmModule.forFeature([Member, Event, EventAttendee])],
	exports: [
		LeadersStatisticsService,
		EventsRankingStatisticsService,
		ChildrenStatisticsService,
		SummaryStatisticsService,
	],
})
export class StatisticsModelModule {}
