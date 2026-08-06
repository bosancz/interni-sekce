import { Module } from "@nestjs/common";
import { StatisticsModelModule } from "src/models/statistics/statistics-model.module";
import { EventsStatisticsController } from "./controllers/events-statistics.controller";
import { LeadersStatisticsController } from "./controllers/leaders-statistics.controller";
import { MembersStatisticsController } from "./controllers/members-statistics.controller";
import { PaddlersStatisticsController } from "./controllers/paddlers-statistics.controller";

@Module({
	controllers: [
		PaddlersStatisticsController,
		MembersStatisticsController,
		EventsStatisticsController,
		LeadersStatisticsController,
	],
	imports: [StatisticsModelModule],
})
export class StatisticsModule {}
