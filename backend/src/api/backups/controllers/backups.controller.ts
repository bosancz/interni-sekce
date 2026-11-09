import { Controller, Get, Query, Req } from "@nestjs/common";
import { ApiResponse, ApiTags } from "@nestjs/swagger";
import { Request } from "express";
import { Config } from "src/config";
import { AcController, AcLinks } from "src/access-control/access-control-lib";
import { Authenticated } from "src/auth/decorators/authenticated.decorator";
import { BackupRunsRepository } from "src/models/backups/repositories/backup-runs.repository";
import { BackupRunTypes } from "src/models/backups/schema/backup-run";
import { BackupsCheckService } from "src/models/backups/services/backups-check.service";
import { BackupRunsListPermission, BackupsSummaryPermission } from "../acl/backups.acl";
import { BackupRunResponse, BackupRunsListQuery, BackupsSummaryResponse } from "../dto/backup.dto";

@Controller("backups")
@Authenticated()
@AcController()
@ApiTags("Backups")
export class BackupsController {
	constructor(
		private backupRuns: BackupRunsRepository,
		private backupsCheckService: BackupsCheckService,
		private config: Config,
	) {}

	@Get()
	@AcLinks(BackupsSummaryPermission)
	@ApiResponse({ status: 200, type: BackupsSummaryResponse })
	async getBackups(@Req() req: Request): Promise<BackupsSummaryResponse> {
		BackupsSummaryPermission.canOrThrow(req);

		const [schedule, lastDatabase, lastDatabaseSuccess, lastFiles, lastFilesSuccess, problems] = await Promise.all([
			this.backupRuns.getSchedule(),
			this.backupRuns.getLastRun(BackupRunTypes.database),
			this.backupRuns.getLastSuccess(BackupRunTypes.database),
			this.backupRuns.getLastRun(BackupRunTypes.files),
			this.backupRuns.getLastSuccess(BackupRunTypes.files),
			this.backupsCheckService.getProblems(),
		]);

		const folderId = this.config.backups.driveFolderId;
		const driveFolderUrl = folderId
			? `https://drive.google.com/drive/folders/${encodeURIComponent(folderId)}`
			: null;

		return {
			schedule,
			lastDatabase,
			lastDatabaseSuccess,
			lastFiles,
			lastFilesSuccess,
			driveFolderUrl,
			problems,
		};
	}

	@Get("runs")
	@AcLinks(BackupRunsListPermission)
	@ApiResponse({ status: 200, type: BackupRunResponse, isArray: true })
	async listBackupRuns(@Req() req: Request, @Query() query: BackupRunsListQuery): Promise<BackupRunResponse[]> {
		BackupRunsListPermission.canOrThrow(req);

		return this.backupRuns.listRuns({
			limit: query.limit ?? this.config.backups.runsDefaultLimit,
			offset: query.offset,
		});
	}
}
