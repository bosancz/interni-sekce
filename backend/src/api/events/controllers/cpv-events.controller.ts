import { Controller, Get, Req } from "@nestjs/common";
import { ApiResponse, ApiTags } from "@nestjs/swagger";
import { Request } from "express";
import { AcController, AcLinks, WithLinks } from "src/access-control/access-control-lib";
import { CPVEventsListRoute } from "../acl/cpv-events.acl";
import { CPVEventResponse } from "../dto/cpv-event.dto";

@Controller("cpv-events")
@AcController()
@ApiTags("Events")
export class CPVEventsController {
  @Get("")
  @AcLinks(CPVEventsListRoute)
  @ApiResponse({ status: 200, type: WithLinks(CPVEventResponse), isArray: true })
  async getCPVEvents(@Req() req: Request): Promise<CPVEventResponse[]> {
    CPVEventsListRoute.canOrThrow(req, undefined);
    // TODO: load events from raft.cz
    return [];
  }
}
