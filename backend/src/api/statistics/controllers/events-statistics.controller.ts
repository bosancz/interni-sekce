import { Controller, Get } from "@nestjs/common";
import { ApiResponse, ApiTags } from "@nestjs/swagger";
import { EventsAttendeesReportResponse } from "../dto/events-attendees-report.dto";
import { EventsLeadersReportResponse } from "../dto/events-leaders-report.dto";
import { EventsReportResponse } from "../dto/events-report.dto";

@Controller("statistics/events")
@ApiTags("Statistics")
export class EventsStatisticsController {
  @Get("years")
  @ApiResponse({ schema: { type: "array", items: { type: "number" } } })
  getEventsYears() {
    // TODO:
    return {};
  }

  @Get("events")
  @ApiResponse({ type: EventsReportResponse })
  getEventsReport() {
    // TODO:
    return {};
  }

  @Get("attendees")
  @ApiResponse({ type: EventsAttendeesReportResponse })
  getEventsAttendeesReport() {
    // TODO:
    return {};
  }

  @Get("leaders")
  @ApiResponse({ type: EventsLeadersReportResponse })
  getEventsLeadersReport() {
    // TODO:
    return {};
  }
}
