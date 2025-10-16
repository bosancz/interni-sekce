import { Controller, Get, Param, Req } from "@nestjs/common";
import { ApiResponse, ApiTags } from "@nestjs/swagger";
import { Request } from "express";
import { PaddlersStatisticsService } from "src/models/statistics/services/paddlers-statistics.service";
import { PadlersRankingRoute, PadlersTotalsRoute } from "../acl/paddlers.acl";
import { PaddlersRankingResponse } from "../dto/paddlers-ranking.dto";
import { PadlersTotalsResponse } from "../dto/paddlers-totals.dto";

@Controller("statistics/paddlers")
@ApiTags("Statistics")
export class PaddlersStatisticsController {
	constructor(private statistics: PaddlersStatisticsService) {}

	@Get("")
	@ApiResponse({ status: 200, type: PadlersTotalsResponse })
	getPaddlersTotals(@Req() req: Request): Promise<PadlersTotalsResponse> {
		PadlersTotalsRoute.canOrThrow(req);

		return this.statistics.getPaddlersTotals();
	}

	@Get(":year/ranking")
	@ApiResponse({ status: 200, type: PaddlersRankingResponse, isArray: true })
	getPaddlersRanking(@Req() req: Request, @Param("year") year: number): Promise<PaddlersRankingResponse[]> {
		PadlersRankingRoute.canOrThrow(req);

		return this.statistics.getPaddlersRanking(year);
	}
}
