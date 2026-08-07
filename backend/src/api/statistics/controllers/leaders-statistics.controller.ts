import { Controller, Get, Param, ParseIntPipe, Query, Req } from "@nestjs/common";
import { ApiResponse, ApiTags } from "@nestjs/swagger";
import { Request } from "express";
import { AcController, AcLinks } from "src/access-control/access-control-lib";
import { Authenticated } from "src/auth/decorators/authenticated.decorator";
import { LeadersStatisticsService } from "src/models/statistics/services/leaders-statistics.service";
import { LeaderEventsPermission, TopLeadersPermission } from "../acl/leaders.acl";
import {
	LeaderEventResponse,
	StatisticsYearQuery,
	TopLeadersQuery,
	TopLeadersResponse,
} from "../dto/top-leaders.dto";

const DEFAULT_TOP_LEADERS_LIMIT = 5;

@Controller("statistics/leaders")
@Authenticated()
@AcController()
@ApiTags("Statistics")
export class LeadersStatisticsController {
	constructor(private statistics: LeadersStatisticsService) {}

	@Get("top")
	@AcLinks(TopLeadersPermission)
	@ApiResponse({ status: 200, type: TopLeadersResponse })
	getTopLeaders(@Req() req: Request, @Query() query: TopLeadersQuery): Promise<TopLeadersResponse> {
		TopLeadersPermission.canOrThrow(req);

		return this.statistics.getLeadersStatistics(
			query.year ?? new Date().getFullYear(),
			query.limit ?? DEFAULT_TOP_LEADERS_LIMIT,
		);
	}

	@Get(":memberId/events")
	@ApiResponse({ status: 200, type: LeaderEventResponse, isArray: true })
	getLeaderEvents(
		@Req() req: Request,
		@Param("memberId", ParseIntPipe) memberId: number,
		@Query() query: StatisticsYearQuery,
	): Promise<LeaderEventResponse[]> {
		LeaderEventsPermission.canOrThrow(req);

		return this.statistics.getLeaderEvents(memberId, query.year ?? new Date().getFullYear());
	}
}
