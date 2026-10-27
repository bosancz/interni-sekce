import { Config } from "src/config";
import { Controller, Get, Param, ParseIntPipe, Query, Req } from "@nestjs/common";
import { ApiResponse, ApiTags } from "@nestjs/swagger";
import { Request } from "express";
import { AcController, AcLinks } from "src/access-control/access-control-lib";
import { Authenticated } from "src/auth/decorators/authenticated.decorator";
import { ChildrenStatisticsService } from "src/models/statistics/services/children-statistics.service";
import { ChildEventsPermission, TopChildrenPermission } from "../acl/children.acl";
import { ChildEventResponse, TopChildrenQuery, TopChildrenResponse } from "../dto/top-children.dto";
import { StatisticsYearQuery } from "../dto/top-leaders.dto";

@Controller("statistics/children")
@Authenticated()
@AcController()
@ApiTags("Statistics")
export class ChildrenStatisticsController {
	constructor(
		private statistics: ChildrenStatisticsService,
		private config: Config,
	) {}

	@Get("top")
	@AcLinks(TopChildrenPermission)
	@ApiResponse({ status: 200, type: TopChildrenResponse })
	getTopChildren(@Req() req: Request, @Query() query: TopChildrenQuery): Promise<TopChildrenResponse> {
		TopChildrenPermission.canOrThrow(req);

		return this.statistics.getTopChildrenStatistics(
			query.year ?? new Date().getFullYear(),
			query.limit ?? this.config.statistics.topLimit,
		);
	}

	@Get(":memberId/events")
	@ApiResponse({ status: 200, type: ChildEventResponse, isArray: true })
	getChildEvents(
		@Req() req: Request,
		@Param("memberId", ParseIntPipe) memberId: number,
		@Query() query: StatisticsYearQuery,
	): Promise<ChildEventResponse[]> {
		ChildEventsPermission.canOrThrow(req);

		return this.statistics.getChildEvents(memberId, query.year ?? new Date().getFullYear());
	}
}
