import { Controller, Get, Param, Req } from "@nestjs/common";
import { ApiResponse, ApiTags } from "@nestjs/swagger";
import { Request } from "express";
import { StatisticsService } from "src/models/statistics/services/statistics.service";
import { PadlersRankingRoute, PadlersTotalsRoute } from "../acl/paddlers.acl";
import { PaddlersRankingResponse } from "../dto/paddlers-ranking.dto";
import { PadlersTotalsResponse } from "../dto/paddlers-totals.dto";

@Controller("statistics/paddlers")
@ApiTags("Statistics")
export class PaddlersController {
  constructor(private statistics: StatisticsService) {}

  @Get("")
  @ApiResponse({ type: PadlersTotalsResponse })
  getPaddlersTotals(@Req() req: Request): Promise<PadlersTotalsResponse> {
    PadlersTotalsRoute.canOrThrow(req, undefined);

    return this.statistics.getPaddlersTotals();
  }

  @Get(":year/ranking")
  @ApiResponse({ type: PaddlersRankingResponse, isArray: true })
  getPaddlersRanking(@Req() req: Request, @Param("year") year: number): Promise<PaddlersRankingResponse[]> {
    PadlersRankingRoute.canOrThrow(req, undefined);

    return this.statistics.getPaddlersRanking(year);
  }
}
