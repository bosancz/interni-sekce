import { Injectable, Logger } from "@nestjs/common";
import { Config } from "src/config";
import { GithubService } from "src/models/github/services/github.service";
import { MailService } from "src/models/mail/services/mail.service";
import { UsersRepository } from "src/models/users/repositories/users.repository";
import { BugReportBody } from "../dto/bug-report-body.dto";
import { BugReportMailTemplate } from "../mail-templates/bug-report/bug-report.mail-template";

/** A bug report resolved into everything the email and issue need. */
export interface BugReport {
	reporter: string;
	environment: string;
	url?: string;
	description: string;
}

@Injectable()
export class FeedbackService {
	private readonly logger = new Logger(FeedbackService.name);

	constructor(
		private readonly mailService: MailService,
		private readonly github: GithubService,
		private readonly users: UsersRepository,
		private readonly config: Config,
	) {}

	/**
	 * Resolve a submitted bug report into the context the email and issue share: the
	 * reporter's identity (from the authenticated user) and the current environment.
	 */
	async buildBugReport(userId: number, body: BugReportBody): Promise<BugReport> {
		const user = await this.users.getUser(userId, { includeMember: true });

		const reporter =
			[user?.member?.nickname, user?.login && `<${user.login}>`].filter(Boolean).join(" ") || "neznámý";

		return {
			reporter,
			environment: this.config.app.environmentTitle || this.config.environment,
			url: body.url,
			description: body.description,
		};
	}

	/**
	 * Construct and send the bug-report email to the configured recipient.
	 * Returns whether the email was actually sent; delivery failures are logged, not thrown,
	 * so the caller can fall back to the other channel.
	 */
	async sendBugReportEmail(report: BugReport): Promise<boolean> {
		const mail = BugReportMailTemplate(this.config.feedback.bugReportRecipient, {
			reporter: report.reporter,
			environment: report.environment,
			url: report.url,
			description: report.description,
		});

		try {
			await this.mailService.sendMail(mail);
			this.logger.verbose("Bug report email sent");
			return true;
		} catch (err) {
			this.logger.error(`Failed to send bug report email: ${(err as Error).message}`);
			return false;
		}
	}

	/**
	 * Construct and file the bug report as a GitHub issue.
	 * Returns whether an issue was actually created — false when GitHub is not configured or
	 * the API call fails (logged, not thrown), so the caller can fall back to the email.
	 */
	async fileBugReportIssue(report: BugReport): Promise<boolean> {
		if (!this.github.isConfigured) return false;

		try {
			const issue = await this.github.createIssue(this.config.github.bugReportRepo, {
				title: this.issueTitle(report.description, this.config.app.environmentTitle),
				body: this.issueBody(report),
				labels: [this.config.github.bugReportLabel],
			});

			this.logger.verbose(`Bug report filed as GitHub issue #${issue.number} (${issue.url}).`);
			return true;
		} catch (err) {
			this.logger.error(`Failed to file bug report as a GitHub issue: ${(err as Error).message}`);
			return false;
		}
	}

	private issueBody(report: BugReport): string {
		return [
			`**Nahlásil:** ${report.reporter}`,
			`**Prostředí:** ${report.environment}`,
			report.url ? `**URL:** ${report.url}` : null,
			"",
			"---",
			"",
			report.description,
		]
			.filter((line) => line !== null)
			.join("\n");
	}

	/**
	 * Build a concise issue title from the free-text description (first line, truncated).
	 * Non-production environments (ENV_TITLE set, e.g. "TEST") are prefixed so a report from
	 * the testing environment is recognizable straight from the issue list.
	 */
	private issueTitle(description: string, environmentTitle: string): string {
		const firstLine = description.trim().split("\n")[0].trim();
		const summary = firstLine.length > 80 ? `${firstLine.slice(0, 77)}…` : firstLine;
		const prefix = environmentTitle ? `[${environmentTitle}] ` : "";
		return `${prefix}Nahlášená chyba: ${summary}`;
	}
}
