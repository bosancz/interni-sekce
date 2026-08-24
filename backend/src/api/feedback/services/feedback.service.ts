import { Injectable, InternalServerErrorException, Logger } from "@nestjs/common";
import { Config } from "src/config";
import { GithubService } from "src/models/github/services/github.service";
import { MailService } from "src/models/mail/services/mail.service";
import { UsersRepository } from "src/models/users/repositories/users.repository";
import { BugReportBody } from "../dto/bug-report-body.dto";
import { BugReportMailTemplate } from "../mail-templates/bug-report/bug-report.mail-template";

export interface BugReport {
	reporter: string;
	reporterName: string;
	reporterUrl: string;
	url?: string;
	description: string;
}

export interface BugReportIssue {
	number: number;
	url: string;
}

const ISSUE_TITLE_MAX_LENGTH = 80;
const ISSUE_TITLE_MIN_TEXT_LENGTH = 20;

@Injectable()
export class FeedbackService {
	private readonly logger = new Logger(FeedbackService.name);

	constructor(
		private readonly mailService: MailService,
		private readonly github: GithubService,
		private readonly users: UsersRepository,
		private readonly config: Config,
	) {}

	async buildBugReport(userId: number, body: BugReportBody): Promise<BugReport> {
		const user = await this.users.getUser(userId, { includeMember: true });

		const reporterName = user?.member?.nickname || user?.login || "neznámý";

		const reporter =
			[user?.member?.nickname, user?.login && `(${user.login})`].filter(Boolean).join(" ") || "neznámý";

		return {
			reporter,
			reporterName,
			reporterUrl: `${this.config.app.baseUrl}/admin/uzivatele/${userId}`,
			url: body.url,
			description: body.description,
		};
	}

	async sendBugReportEmail(report: BugReport, issue?: BugReportIssue | null): Promise<void> {
		const mail = BugReportMailTemplate(this.config.feedback.bugReportRecipient, {
			reporter: report.reporter,
			reporterUrl: report.reporterUrl,
			url: report.url,
			description: report.description,
			issueNumber: issue?.number,
			issueUrl: issue?.url,
		});

		try {
			await this.mailService.sendMail(mail);
			this.logger.verbose("Bug report email sent");
		} catch (err) {
			this.logger.error(`Failed to send bug report email: ${(err as Error).message}`);
			throw err;
		}
	}

	async fileBugReportIssue(report: BugReport): Promise<BugReportIssue | null> {
		if (!this.github.isConfigured) return null;

		const { title, body } = this.splitDescription(report.description, report.reporterName);

		try {
			const issue = await this.github.createIssue(this.config.github.bugReportRepo, {
				title,
				body: this.issueBody(report, body),
				labels: [this.config.github.bugReportLabel],
			});

			this.logger.verbose(`Bug report filed as GitHub issue #${issue.number} (${issue.url}).`);
			return issue;
		} catch (err) {
			this.logger.error(`Failed to file bug report as a GitHub issue: ${(err as Error).message}`);
			throw new InternalServerErrorException("Bug report could not be filed as a GitHub issue.");
		}
	}

	private issueBody(report: BugReport, description: string): string {
		return [
			description || null,
			description ? "" : null,
			description ? "---" : null,
			description ? "" : null,
			`**Nahlásil:** [${report.reporter}](${report.reporterUrl})`,
			report.url ? `**URL:** ${report.url}` : null,
		]
			.filter((line) => line !== null)
			.join("\n");
	}

	private splitDescription(description: string, reporterName: string): { title: string; body: string } {
		const text = description.replace(/\r\n/g, "\n").trim();
		const breakIndex = text.indexOf("\n");

		const firstLine = (breakIndex === -1 ? text : text.slice(0, breakIndex)).trim();
		const otherLines = breakIndex === -1 ? "" : text.slice(breakIndex + 1).trim();

		const suffix = ` (${reporterName})`;
		const maxLength = Math.max(ISSUE_TITLE_MIN_TEXT_LENGTH, ISSUE_TITLE_MAX_LENGTH - suffix.length);

		if (!firstLine) return { title: `Nahlášená chyba${suffix}`, body: otherLines };

		if (firstLine.length <= maxLength) return { title: `${firstLine}${suffix}`, body: otherLines };

		const lastSpace = firstLine.lastIndexOf(" ", maxLength - 1);
		const cut = lastSpace > maxLength / 2 ? lastSpace : maxLength - 1;

		return {
			title: `${firstLine.slice(0, cut).trimEnd()}…${suffix}`,
			body: [`…${firstLine.slice(cut).trim()}`, otherLines].filter(Boolean).join("\n"),
		};
	}
}
