import { Controller, Get } from "@nestjs/common";
import { ApiResponse, ApiTags } from "@nestjs/swagger";
import { AcController } from "src/access-control/access-control-lib/decorators/ac-controller.decorator";
import { AcLinks } from "src/access-control/access-control-lib/decorators/ac-links.decorator";
import { RootRoute } from "../acl/root.acl";
import { RootResponse } from "../dto/root-response";

@Controller("root")
@ApiTags("API")
@AcController()
export class RootController {
  @Get()
  @AcLinks(RootRoute)
  @ApiResponse({ type: RootResponse })
  getApiRoot() {
    return {};
  }
}
