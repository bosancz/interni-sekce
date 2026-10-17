import { BullModule } from "@nestjs/bullmq";
import { DynamicModule, Module } from "@nestjs/common";
import { GoogleModelModule } from "src/models/google/google-model.module";
import { BACKUPS_QUEUE } from "./backups-queue";
import { DbBackupCommand } from "./commands/db-backup.command";
import { BackupsScheduleProcessor } from "./processors/backups-schedule.processor";
import { DatabaseBackupService } from "./services/database-backup.service";

@Module({})
export class BackupsModelModule {
	static forRoot(options: { processors: boolean }): DynamicModule {
		return {
			module: BackupsModelModule,
			imports: [BullModule.registerQueue({ name: BACKUPS_QUEUE }), GoogleModelModule],
			providers: [
				DatabaseBackupService,
				...(options.processors ? [BackupsScheduleProcessor] : [DbBackupCommand]),
			],
			exports: [DatabaseBackupService],
		};
	}
}
