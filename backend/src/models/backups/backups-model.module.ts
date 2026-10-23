import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { NotificationsModelModule } from "src/models/notifications/notifications-model.module";
import { BackupsCheckCommand } from "./commands/backups-check.command";
import { BackupRun } from "./entities/backup-run.entity";
import { BackupSchedule } from "./entities/backup-schedule.entity";
import { BackupRunsRepository } from "./repositories/backup-runs.repository";
import { BackupsCheckService } from "./services/backups-check.service";

@Module({
	imports: [TypeOrmModule.forFeature([BackupRun, BackupSchedule]), NotificationsModelModule],
	providers: [BackupRunsRepository, BackupsCheckService, BackupsCheckCommand],
	exports: [BackupRunsRepository, BackupsCheckService],
})
export class BackupsModelModule {}
