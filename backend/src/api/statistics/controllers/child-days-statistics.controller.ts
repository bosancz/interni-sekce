import { Controller, Get, Query, Req } from "@nestjs/common";
import { ApiResponse, ApiTags } from "@nestjs/swagger";
import { Request } from "express";
import { AcController, AcLinks } from "src/access-control/access-control-lib";
import { Authenticated } from "src/auth/decorators/authenticated.decorator";
import { ChildDaysStatisticsService } from "src/models/statistics/services/child-days-statistics.service";
import { ChildDaysPermission } from "../acl/child-days.acl";
import { ChildDaysResponse } from "../dto/child-days.dto";
import { StatisticsYearQuery } from "../dto/top-leaders.dto";

@Controller("statistics/child-days")
@Authenticated()
@AcController()
@ApiTags("Statistics")
export class ChildDaysStatisticsController {
	constructor(private statistics: ChildDaysStatisticsService) {}

	@Get()
	@AcLinks(ChildDaysPermission)
	@ApiResponse({ status: 200, type: ChildDaysResponse })
	getChildDays(@Req() req: Request, @Query() query: StatisticsYearQuery): Promise<ChildDaysResponse> {
		ChildDaysPermission.canOrThrow(req);

		return this.statistics.getChildDaysStatistics(query.year ?? new Date().getFullYear());
	}
}
