import { Controller, Get, Query, Req } from "@nestjs/common";
import { ApiResponse, ApiTags } from "@nestjs/swagger";
import { Request } from "express";
import { AcController, AcLinks } from "src/access-control/access-control-lib";
import { Authenticated } from "src/auth/decorators/authenticated.decorator";
import { SummaryStatisticsService } from "src/models/statistics/services/summary-statistics.service";
import { SummaryPermission } from "../acl/summary.acl";
import { SummaryResponse } from "../dto/summary.dto";
import { StatisticsYearQuery } from "../dto/top-leaders.dto";

@Controller("statistics/summary")
@Authenticated()
@AcController()
@ApiTags("Statistics")
export class SummaryStatisticsController {
	constructor(private statistics: SummaryStatisticsService) {}

	@Get()
	@AcLinks(SummaryPermission)
	@ApiResponse({ status: 200, type: SummaryResponse })
	getSummary(@Req() req: Request, @Query() query: StatisticsYearQuery): Promise<SummaryResponse> {
		SummaryPermission.canOrThrow(req);

		return this.statistics.getSummaryStatistics(query.year ?? new Date().getFullYear());
	}
}
