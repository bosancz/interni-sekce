import { Controller, Get, Req } from "@nestjs/common";
import { ApiResponse, ApiTags } from "@nestjs/swagger";
import { Request } from "express";
import { AcController, AcLinks } from "src/access-control/access-control-lib";
import { Authenticated } from "src/auth/decorators/authenticated.decorator";
import { ServerStatsService } from "src/models/worker/services/server-stats.service";
import { WorkersService } from "src/models/worker/services/workers.service";
import { ServerStatsPermission, WorkersListPermission } from "../acl/worker.acl";
import { ServerStatsResponse, WorkerResponse } from "../dto/worker.dto";

@Controller("workers")
@Authenticated()
@AcController()
@ApiTags("Worker")
export class WorkersController {
	constructor(
		private workersService: WorkersService,
		private serverStatsService: ServerStatsService,
	) {}

	@Get()
	@AcLinks(WorkersListPermission)
	@ApiResponse({ status: 200, type: WorkerResponse, isArray: true })
	async listWorkers(@Req() req: Request): Promise<WorkerResponse[]> {
		WorkersListPermission.canOrThrow(req);

		return this.workersService.getWorkers();
	}

	@Get("server")
	@AcLinks(ServerStatsPermission)
	@ApiResponse({ status: 200, type: ServerStatsResponse })
	async getServerStats(@Req() req: Request): Promise<ServerStatsResponse> {
		ServerStatsPermission.canOrThrow(req);

		return this.serverStatsService.getStats();
	}
}
