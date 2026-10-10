import { Controller, Get, Query, Req } from "@nestjs/common";
import { ApiResponse, ApiTags } from "@nestjs/swagger";
import { Request } from "express";
import { AcController, AcLinks } from "src/access-control/access-control-lib";
import { Authenticated } from "src/auth/decorators/authenticated.decorator";
import { PaddlersStatisticsService } from "src/models/statistics/services/paddlers-statistics.service";
import { PaddlersRankingPermission, PaddlersSummaryPermission } from "../acl/paddlers.acl";
import { PaddlersRankingResponse, PaddlersSummaryResponse } from "../dto/paddlers-ranking.dto";
import { StatisticsYearQuery } from "../dto/top-leaders.dto";

@Controller("statistics/paddlers")
@Authenticated()
@AcController()
@ApiTags("Statistics")
export class PaddlersStatisticsController {
	constructor(private statistics: PaddlersStatisticsService) {}

	@Get("summary")
	@AcLinks(PaddlersSummaryPermission)
	@ApiResponse({ status: 200, type: PaddlersSummaryResponse })
	getPaddlersSummary(@Req() req: Request, @Query() query: StatisticsYearQuery): Promise<PaddlersSummaryResponse> {
		PaddlersSummaryPermission.canOrThrow(req);

		return this.statistics.getPaddlersSummary(query.year ?? new Date().getFullYear());
	}

	@Get("ranking")
	@AcLinks(PaddlersRankingPermission)
	@ApiResponse({ status: 200, type: PaddlersRankingResponse })
	getPaddlersRanking(@Req() req: Request, @Query() query: StatisticsYearQuery): Promise<PaddlersRankingResponse> {
		PaddlersRankingPermission.canOrThrow(req);

		return this.statistics.getPaddlersRanking(query.year ?? new Date().getFullYear());
	}
}
