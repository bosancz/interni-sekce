import { Controller, Get } from "@nestjs/common";
import { ApiResponse, ApiTags } from "@nestjs/swagger";
import { AcController, AcLinks, WithLinks } from "src/access-control/access-control-lib";
import { Config } from "src/config";
import { RootPermission } from "../acl/root.acl";
import { RootResponse } from "../dto/root-response";

@Controller("")
@ApiTags("Root")
@AcController()
export class RootController {
	constructor(private readonly config: Config) {}

	@Get()
	@AcLinks(RootPermission)
	@ApiResponse({ status: 200, type: WithLinks(RootResponse) })
	getApiInfo(): RootResponse {
		return {
			version: this.config.app.version,
			environmentTitle: this.config.app.environmentTitle,
			googleClientId: this.config.google.clientId,
		};
	}
}
