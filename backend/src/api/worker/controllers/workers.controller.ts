import { Controller, Get, Optional, Req } from "@nestjs/common";
import { ApiResponse, ApiTags } from "@nestjs/swagger";
import { Request } from "express";
import { AcController, AcLinks } from "src/access-control/access-control-lib";
import { Authenticated } from "src/auth/decorators/authenticated.decorator";
import { WorkersService } from "src/models/worker/services/workers.service";
import { WorkersListPermission } from "../acl/worker.acl";
import { WorkerResponse } from "../dto/worker.dto";

@Controller("workers")
@Authenticated()
@AcController()
@ApiTags("Worker")
export class WorkersController {
	constructor(@Optional() private workersService?: WorkersService) {}

	@Get()
	@AcLinks(WorkersListPermission)
	@ApiResponse({ status: 200, type: WorkerResponse, isArray: true })
	async listWorkers(@Req() req: Request): Promise<WorkerResponse[]> {
		WorkersListPermission.canOrThrow(req);

		return this.workersService?.getWorkers() ?? [];
	}
}
