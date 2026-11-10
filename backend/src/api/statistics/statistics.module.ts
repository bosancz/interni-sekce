import { Module } from "@nestjs/common";
import { StatisticsModelModule } from "src/models/statistics/statistics-model.module";
import { ChildrenStatisticsController } from "./controllers/children-statistics.controller";
import { EventsStatisticsController } from "./controllers/events-statistics.controller";
import { LeadersStatisticsController } from "./controllers/leaders-statistics.controller";
import { MembersStatisticsController } from "./controllers/members-statistics.controller";
import { SummaryStatisticsController } from "./controllers/summary-statistics.controller";

@Module({
	controllers: [
		MembersStatisticsController,
		EventsStatisticsController,
		LeadersStatisticsController,
		ChildrenStatisticsController,
		SummaryStatisticsController,
	],
	imports: [StatisticsModelModule],
})
export class StatisticsModule {}
