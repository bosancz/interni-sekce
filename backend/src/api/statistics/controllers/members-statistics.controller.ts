import { Controller, Get } from "@nestjs/common";
import { ApiResponse, ApiTags } from "@nestjs/swagger";
import { MembersReportResponse } from "../dto/members-report.dto";

@Controller("statistics/members")
@ApiTags("Statistics")
export class MembersStatisticsController {
  @Get()
  @ApiResponse({ status: 200, type: MembersReportResponse })
  getMembersReport() {
    // TODO:
    throw new Error("Not implemented");
  }
}
