import { Controller, Get, Query, Req } from "@nestjs/common";
import { ApiResponse, ApiTags } from "@nestjs/swagger";
import { Request } from "express";
import { AcController, AcLinks } from "src/access-control/access-control-lib";
import { Authenticated } from "src/auth/decorators/authenticated.decorator";
import { EventsRankingStatisticsService } from "src/models/statistics/services/events-ranking-statistics.service";
import { TopEventsPermission } from "../acl/events-ranking.acl";
import { EventsAttendeesReportResponse } from "../dto/events-attendees-report.dto";
import { EventsLeadersReportResponse } from "../dto/events-leaders-report.dto";
import { EventsReportResponse } from "../dto/events-report.dto";
import { TopEventsQuery, TopEventsResponse } from "../dto/top-events.dto";

const DEFAULT_TOP_EVENTS_LIMIT = 5;

@Controller("statistics/events")
@Authenticated()
@AcController()
@ApiTags("Statistics")
export class EventsStatisticsController {
	constructor(private statistics: EventsRankingStatisticsService) {}

	@Get("top")
	@AcLinks(TopEventsPermission)
	@ApiResponse({ status: 200, type: TopEventsResponse })
	getTopEvents(@Req() req: Request, @Query() query: TopEventsQuery): Promise<TopEventsResponse> {
		TopEventsPermission.canOrThrow(req);

		return this.statistics.getTopEventsStatistics(
			query.year ?? new Date().getFullYear(),
			query.limit ?? DEFAULT_TOP_EVENTS_LIMIT,
		);
	}

	@Get("years")
	@ApiResponse({ status: 200, schema: { type: "array", items: { type: "number" } } })
	getEventsReportYears() {
		// TODO:
		return {};
	}

	@Get("events")
	@ApiResponse({ status: 200, type: EventsReportResponse })
	getEventsReport() {
		// TODO:
		return {};
	}

	@Get("attendees")
	@ApiResponse({ status: 200, type: EventsAttendeesReportResponse })
	getEventsAttendeesReport() {
		// TODO:
		return {};
	}

	@Get("leaders")
	@ApiResponse({ status: 200, type: EventsLeadersReportResponse })
	getEventsLeadersReport() {
		// TODO:
		return {};
	}
}
