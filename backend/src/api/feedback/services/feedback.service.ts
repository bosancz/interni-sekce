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

/** The GitHub issue a bug report was filed as. */
export interface BugReportIssue {
	number: number;
	url: string;
}

/** Longest issue title built from the report; the rest of the line continues in the body. */
const ISSUE_TITLE_MAX_LENGTH = 80;

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
	 * Construct and send the bug-report email to the configured recipient. When the report was
	 * already filed as a GitHub issue, the email links to it.
	 * Returns whether the email was actually sent; delivery failures are logged, not thrown,
	 * so the caller can fall back to the other channel.
	 */
	async sendBugReportEmail(report: BugReport, issue?: BugReportIssue | null): Promise<boolean> {
		const mail = BugReportMailTemplate(this.config.feedback.bugReportRecipient, {
			reporter: report.reporter,
			environment: report.environment,
			url: report.url,
			description: report.description,
			issueNumber: issue?.number,
			issueUrl: issue?.url,
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
	 * Returns the created issue, or null when GitHub is not configured or the API call fails
	 * (logged, not thrown), so the caller can fall back to the email alone.
	 */
	async fileBugReportIssue(report: BugReport): Promise<BugReportIssue | null> {
		if (!this.github.isConfigured) return null;

		const { title, body } = this.splitDescription(report.description);

		try {
			const issue = await this.github.createIssue(this.config.github.bugReportRepo, {
				title: this.issueTitle(title, this.config.app.environmentTitle),
				body: this.issueBody(report, body),
				labels: [this.config.github.bugReportLabel],
			});

			this.logger.verbose(`Bug report filed as GitHub issue #${issue.number} (${issue.url}).`);
			return issue;
		} catch (err) {
			this.logger.error(`Failed to file bug report as a GitHub issue: ${(err as Error).message}`);
			return null;
		}
	}

	private issueBody(report: BugReport, description: string): string {
		return [
			`**Nahlásil:** ${report.reporter}`,
			`**Prostředí:** ${report.environment}`,
			report.url ? `**URL:** ${report.url}` : null,
			description ? "" : null,
			description ? "---" : null,
			description ? "" : null,
			description || null,
		]
			.filter((line) => line !== null)
			.join("\n");
	}

	/**
	 * Split the free-text description into the issue title and the issue body: the first line
	 * becomes the title, every following line stays in the body. A first line too long for a
	 * title is cut at the last word that fits, ends with a horizontal ellipsis and continues
	 * (ellipsis-prefixed) at the top of the body, so nothing the user wrote is lost.
	 */
	private splitDescription(description: string): { title: string; body: string } {
		const text = description.replace(/\r\n/g, "\n").trim();
		const breakIndex = text.indexOf("\n");

		const firstLine = (breakIndex === -1 ? text : text.slice(0, breakIndex)).trim();
		const otherLines = breakIndex === -1 ? "" : text.slice(breakIndex + 1).trim();

		if (firstLine.length <= ISSUE_TITLE_MAX_LENGTH) return { title: firstLine, body: otherLines };

		const lastSpace = firstLine.lastIndexOf(" ", ISSUE_TITLE_MAX_LENGTH - 1);
		const cut = lastSpace > ISSUE_TITLE_MAX_LENGTH / 2 ? lastSpace : ISSUE_TITLE_MAX_LENGTH - 1;

		return {
			title: `${firstLine.slice(0, cut).trimEnd()}…`,
			body: [`…${firstLine.slice(cut).trim()}`, otherLines].filter(Boolean).join("\n"),
		};
	}

	/**
	 * Non-production environments (ENV_TITLE set, e.g. "TEST") are prefixed so a report from
	 * the testing environment is recognizable straight from the issue list.
	 */
	private issueTitle(title: string, environmentTitle: string): string {
		const prefix = environmentTitle ? `[${environmentTitle}] ` : "";
		return `${prefix}${title || "Nahlášená chyba"}`;
	}
}
