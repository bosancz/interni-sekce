import { InjectQueue, Processor, WorkerHost } from "@nestjs/bullmq";
import { Logger, OnModuleInit } from "@nestjs/common";
import { Job, Queue } from "bullmq";
import { Config } from "src/config";
import { BACKUPS_QUEUE, BackupJobs } from "../backups-queue";
import { DatabaseBackupService } from "../services/database-backup.service";

@Processor(BACKUPS_QUEUE)
export class BackupsScheduleProcessor extends WorkerHost implements OnModuleInit {
	private logger = new Logger(BackupsScheduleProcessor.name);

	constructor(
		@InjectQueue(BACKUPS_QUEUE) private queue: Queue,
		private databaseBackupService: DatabaseBackupService,
		private config: Config,
	) {
		super();
	}

	async onModuleInit() {
		const { cron, timezone, driveFolderId } = this.config.backup;

		if (!driveFolderId) {
			await this.queue.removeJobScheduler(BackupJobs.database);
			this.logger.warn("Database backups are disabled, BACKUP_DRIVE_FOLDER_ID is not set.");
			return;
		}

		await this.queue.upsertJobScheduler(
			BackupJobs.database,
			{ pattern: cron, tz: timezone },
			{
				name: BackupJobs.database,
				opts: {
					attempts: 3,
					backoff: { type: "exponential", delay: 10 * 60 * 1000 },
					removeOnComplete: 30,
					removeOnFail: 100,
				},
			},
		);

		this.logger.log(`Database backup to Google Drive scheduled at "${cron}" (${timezone}).`);
	}

	async process(job: Job) {
		switch (job.name) {
			case BackupJobs.database:
				return this.databaseBackupService.backup();
			default:
				this.logger.warn(`Unknown backup job "${job.name}".`);
		}
	}
}
