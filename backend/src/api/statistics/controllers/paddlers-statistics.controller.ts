import { Controller, Get, Param, ParseIntPipe, Req } from "@nestjs/common";
import { ApiResponse, ApiTags } from "@nestjs/swagger";
import { Request } from "express";
import { Authenticated } from "src/auth/decorators/authenticated.decorator";
import { PaddlersStatisticsService } from "src/models/statistics/services/paddlers-statistics.service";
import { PadlersRankingPermission, PadlersTotalsPermission } from "../acl/paddlers.acl";
import { PaddlersRankingResponse } from "../dto/paddlers-ranking.dto";
import { PadlersTotalsResponse } from "../dto/paddlers-totals.dto";

@Controller("statistics/paddlers")
@Authenticated()
@ApiTags("Statistics")
export class PaddlersStatisticsController {
	constructor(private statistics: PaddlersStatisticsService) {}

	@Get("")
	@ApiResponse({ status: 200, type: PadlersTotalsResponse })
	getPaddlersTotals(@Req() req: Request): Promise<PadlersTotalsResponse> {
		PadlersTotalsPermission.canOrThrow(req);

		return this.statistics.getPaddlersTotals();
	}

	@Get(":year/ranking")
	@ApiResponse({ status: 200, type: PaddlersRankingResponse, isArray: true })
	getPaddlersRanking(
		@Req() req: Request,
		@Param("year", ParseIntPipe) year: number,
	): Promise<PaddlersRankingResponse[]> {
		PadlersRankingPermission.canOrThrow(req);

		return this.statistics.getPaddlersRanking(year);
	}
}
