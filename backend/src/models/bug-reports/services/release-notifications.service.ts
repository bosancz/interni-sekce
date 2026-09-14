import { Injectable, Logger } from "@nestjs/common";
import { Config } from "src/config";
import { NotificationsService } from "src/models/notifications/services/notifications.service";
import { BugReportsRepository } from "../repositories/bug-reports.repository";
import { ReleaseIssuesService } from "./release-issues.service";

const RELEASED_VERSION = /^v\d/;

@Injectable()
export class ReleaseNotificationsService {
	private readonly logger = new Logger(ReleaseNotificationsService.name);

	constructor(
		private bugReports: BugReportsRepository,
		private notificationsService: NotificationsService,
		private releaseIssuesService: ReleaseIssuesService,
		private config: Config,
	) {}

	async notifyResolvedBugReports() {
		const release = await this.releaseIssuesService.getRelease();
		if (!release) return;

		if (!RELEASED_VERSION.test(release.version)) return;

		if (release.version !== this.config.app.version) {
			this.logger.warn(
				`Skipping: released issues are for ${release.version}, the app runs ${this.config.app.version}.`,
			);
			return;
		}

		const issues = new Map(release.issues.map((issue) => [issue.number, issue]));

		const reports = await this.bugReports.getUnnotifiedBugReports(release.repo, [...issues.keys()]);
		if (!reports.length) return;

		const notified: number[] = [];

		for (const report of reports) {
			const issue = issues.get(report.issueNumber);
			if (!issue || !report.user) continue;

			try {
				await this.notificationsService.onBugReportResolved(report.user, {
					title: report.title,
					version: issue.version,
					description: issue.text,
				});
				notified.push(report.id);
			} catch (err) {
				this.logger.error(
					`Failed to notify the reporter of issue #${report.issueNumber}: ${(err as Error).message}`,
				);
			}
		}

		await this.bugReports.markNotified(notified);

		this.logger.log(`Notified ${notified.length} of ${reports.length} bug reporters about a released fix.`);
	}
}
