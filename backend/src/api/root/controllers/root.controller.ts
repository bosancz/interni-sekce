import { Controller, Get, ServiceUnavailableException } from "@nestjs/common";
import { ApiResponse, ApiTags } from "@nestjs/swagger";
import { AcController, AcLinks, WithLinks } from "src/access-control/access-control-lib";
import { Config } from "src/config";
import { ChangelogPermission } from "../acl/changelog.acl";
import { HealthPermission } from "../acl/health.acl";
import { RootPermission } from "../acl/root.acl";
import { ChangelogResponse } from "../dto/changelog-response";
import { HealthResponse, HealthStatus } from "../dto/health-response";
import { RootResponse } from "../dto/root-response";
import { ChangelogService } from "../services/changelog.service";
import { HealthService } from "../services/health.service";

@Controller("")
@ApiTags("Root")
@AcController()
export class RootController {
	constructor(
		private readonly config: Config,
		private readonly changelogService: ChangelogService,
		private readonly healthService: HealthService,
	) {}

	@Get()
	@AcLinks(RootPermission)
	@ApiResponse({ status: 200, type: WithLinks(RootResponse) })
	getApiInfo(): RootResponse {
		return {
			version: this.config.app.version,
			environmentTitle: this.config.app.environmentTitle,
			googleClientId: this.config.google.clientId,
			mapyCzApiKey: this.config.mapy.apiKey,
		};
	}

	@Get("changelog")
	@AcLinks(ChangelogPermission)
	@ApiResponse({ status: 200, type: WithLinks(ChangelogResponse) })
	getChangelog(): ChangelogResponse {
		return {
			content: this.changelogService.getContent(),
		};
	}

	@Get("health")
	@AcLinks(HealthPermission)
	@ApiResponse({ status: 200, type: WithLinks(HealthResponse) })
	@ApiResponse({ status: 503, type: HealthResponse })
	async getHealth(): Promise<HealthResponse> {
		const health = await this.healthService.getHealth();
		if (health.status !== HealthStatus.ok) throw new ServiceUnavailableException(health);
		return health;
	}
}
