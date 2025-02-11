import { Controller, Get } from "@nestjs/common";
import { ApiResponse, ApiTags } from "@nestjs/swagger";
import { AcController, AcLinks, WithLinks } from "src/access-control/access-control-lib";
import { Config } from "src/config";
import { RootRoute } from "../acl/root.acl";
import { RootResponse } from "../dto/root-response";

@Controller("root")
@ApiTags("API")
@AcController()
export class RootController {
  constructor(private readonly config: Config) {}

  @Get()
  @AcLinks(RootRoute)
  @ApiResponse({ type: WithLinks(RootResponse) })
  getApiInfo(): RootResponse {
    return {
      version: this.config.app.version,
      environmentTitle: this.config.app.environmentTitle,
      googleClientId: this.config.google.clientId,
    };
  }
}
