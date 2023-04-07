import { Controller, Get, Req } from "@nestjs/common";
import { ApiResponse, ApiTags } from "@nestjs/swagger";
import { Request } from "express";
import { AcController } from "src/access-control/access-control-lib/decorators/ac-controller.decorator";
import { AcLinks } from "src/access-control/access-control-lib/decorators/ac-links.decorator";
import { AcContent } from "src/access-control/access-control-lib/schema/ac-content";
import { CPVEventsListRoute } from "../acl/cpv-events.acl";
import { CPVEventResponse } from "../dto/cpv-event.dto";

@Controller("events")
@AcController()
@ApiTags("Events")
export class CPVEventsController {
  @Get()
  @AcLinks(CPVEventsListRoute)
  @ApiResponse({ type: CPVEventResponse, isArray: true })
  async getCPVEvents(@Req() req: Request): Promise<AcContent<CPVEventResponse>[]> {
    CPVEventsListRoute.canOrThrow(req, undefined);
    // TODO: load events from raft.cz
    return [];
  }
}
