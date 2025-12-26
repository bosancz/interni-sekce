import { Controller, Get } from "@nestjs/common";
import { ApiResponse, ApiTags } from "@nestjs/swagger";
import { EventsAttendeesReportResponse } from "../dto/events-attendees-report.dto";
import { EventsLeadersReportResponse } from "../dto/events-leaders-report.dto";
import { EventsReportResponse } from "../dto/events-report.dto";

@Controller("statistics/events")
@ApiTags("Statistics")
export class EventsStatisticsController {
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
