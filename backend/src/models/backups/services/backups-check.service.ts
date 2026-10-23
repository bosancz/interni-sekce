import { Injectable, Logger } from "@nestjs/common";
import { DateTime } from "luxon";
import { Config } from "src/config";
import { NotificationsService } from "src/models/notifications/services/notifications.service";
import { BackupRunsRepository } from "../repositories/backup-runs.repository";
import { BackupRunStatuses, BackupRunTypes } from "../schema/backup-run";

@Injectable()
export class BackupsCheckService {
	private logger = new Logger(BackupsCheckService.name);

	constructor(
		private backupRuns: BackupRunsRepository,
		private notificationsService: NotificationsService,
		private config: Config,
	) {}

	async getProblems(): Promise<string[]> {
		const schedule = await this.backupRuns.getSchedule();
		if (!schedule?.cron) return [];

		const [lastDatabase, lastDatabaseSuccess, lastFiles] = await Promise.all([
			this.backupRuns.getLastRun(BackupRunTypes.database),
			this.backupRuns.getLastSuccess(BackupRunTypes.database),
			this.backupRuns.getLastRun(BackupRunTypes.files),
		]);

		const problems: string[] = [];
		const maxAgeHours = this.config.backups.maxAgeHours;
		const threshold = DateTime.now().minus({ hours: maxAgeHours }).toJSDate();

		if (lastDatabase && (!lastDatabaseSuccess?.finishedAt || lastDatabaseSuccess.finishedAt < threshold)) {
			problems.push(`Záloha databáze se nepovedla déle než ${maxAgeHours} h.`);
		}
		if (lastDatabase?.status === BackupRunStatuses.error) {
			problems.push("Poslední záloha databáze skončila chybou.");
		}
		if (lastFiles?.status === BackupRunStatuses.error) {
			problems.push("Poslední záloha souborů skončila chybou.");
		}

		return problems;
	}

	async check() {
		const problems = await this.getProblems();
		if (!problems.length) {
			this.logger.log("Backups are fine.");
			return;
		}

		const recipients = await this.notificationsService.onBackupProblems(problems);
		this.logger.warn(`Backup problems sent to ${recipients} admins: ${problems.join(" ")}`);
	}
}
