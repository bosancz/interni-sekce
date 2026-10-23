import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { BackupRunStatuses, BackupRunTypes } from "src/models/backups/schema/backup-run";

export class BackupRunProgressResponse {
	@ApiProperty() bytes!: number;
	@ApiProperty() totalBytes!: number;
	@ApiProperty() transfers!: number;
	@ApiProperty() totalTransfers!: number;
	@ApiProperty() checks!: number;
	@ApiProperty() speed!: number;
	@ApiPropertyOptional({ type: "number", nullable: true }) eta!: number | null;
	@ApiProperty() elapsed!: number;
	@ApiProperty() updatedAt!: string;
}

export class BackupRunResponse {
	@ApiProperty() id!: number;
	@ApiProperty({ enum: BackupRunTypes, enumName: "BackupRunTypesEnum" }) type!: BackupRunTypes;
	@ApiProperty({ enum: BackupRunStatuses, enumName: "BackupRunStatusesEnum" }) status!: BackupRunStatuses;
	@ApiProperty() startedAt!: Date;
	@ApiPropertyOptional({ type: "string", nullable: true }) finishedAt!: Date | null;
	@ApiPropertyOptional({ type: "string", nullable: true }) fileName!: string | null;
	@ApiPropertyOptional({ type: "number", nullable: true }) bytes!: number | null;
	@ApiPropertyOptional({ type: "number", nullable: true }) filesTransferred!: number | null;
	@ApiPropertyOptional({ type: "number", nullable: true }) filesRemoved!: number | null;
	@ApiPropertyOptional({ type: BackupRunProgressResponse, nullable: true })
	progress!: BackupRunProgressResponse | null;
	@ApiPropertyOptional({ type: "string", nullable: true }) error!: string | null;
}

export class BackupScheduleResponse {
	@ApiPropertyOptional({ type: "string", nullable: true }) cron!: string | null;
	@ApiPropertyOptional({ type: "string", nullable: true }) timezone!: string | null;
	@ApiPropertyOptional({ type: "string", nullable: true }) nextRunAt!: Date | null;
	@ApiProperty() updatedAt!: Date;
}

export class BackupsSummaryResponse {
	@ApiPropertyOptional({ type: BackupScheduleResponse, nullable: true }) schedule!: BackupScheduleResponse | null;
	@ApiPropertyOptional({ type: BackupRunResponse, nullable: true }) lastDatabase!: BackupRunResponse | null;
	@ApiPropertyOptional({ type: BackupRunResponse, nullable: true }) lastDatabaseSuccess!: BackupRunResponse | null;
	@ApiPropertyOptional({ type: BackupRunResponse, nullable: true }) lastFiles!: BackupRunResponse | null;
	@ApiPropertyOptional({ type: BackupRunResponse, nullable: true }) lastFilesSuccess!: BackupRunResponse | null;
	@ApiPropertyOptional({ type: "string", nullable: true }) driveFolderUrl!: string | null;
	@ApiProperty({ type: "string", isArray: true }) problems!: string[];
	@ApiProperty({ type: BackupRunResponse, isArray: true }) runs!: BackupRunResponse[];
}
