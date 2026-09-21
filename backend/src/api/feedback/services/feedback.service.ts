import { Injectable, InternalServerErrorException, Logger } from "@nestjs/common";
import { Config } from "src/config";
import { parseUserAgent } from "src/helpers/user-agent";
import { BugReportsRepository } from "src/models/bug-reports/repositories/bug-reports.repository";
import { BugReportDisplayModeLabels } from "src/models/bug-reports/schema/bug-report-display-modes";
import { BugReportPointerLabels } from "src/models/bug-reports/schema/bug-report-pointer-types";
import { BugReportStates } from "src/models/bug-reports/schema/bug-report-states";
import { ReleaseIssuesService } from "src/models/bug-reports/services/release-issues.service";
import { GithubService } from "src/models/github/services/github.service";
import { MailService } from "src/models/mail/services/mail.service";
import { UsersRepository } from "src/models/users/repositories/users.repository";
import { BugReportBody } from "../dto/bug-report-body.dto";
import { BugReportResponse } from "../dto/bug-report-response.dto";
import { BugReportMailTemplate } from "../mail-templates/bug-report/bug-report.mail-template";

export interface BugReport {
	userId: number;
	reporter: string;
	reporterName: string;
	reporterUrl: string;
	url?: string;
	description: string;
	frontendVersion?: string;
	backendVersion: string;
	system?: string;
	browser?: string;
	screen?: string;
	viewport?: string;
	display?: string;
	pointer?: string;
	userAgent?: string;
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
		private readonly bugReports: BugReportsRepository,
		private readonly releaseIssuesService: ReleaseIssuesService,
		private readonly config: Config,
	) {}

	async buildBugReport(userId: number, body: BugReportBody, userAgent?: string): Promise<BugReport> {
		const user = await this.users.getUser(userId, { includeMember: true });

		const reporterName = user?.member?.nickname || user?.login || "neznámý";

		const reporter =
			[user?.member?.nickname, user?.login && `(${user.login})`].filter(Boolean).join(" ") || "neznámý";

		const { system, browser } = parseUserAgent(userAgent);

		return {
			userId,
			reporter,
			reporterName,
			reporterUrl: `${this.config.app.baseUrl}/admin/uzivatele/${userId}`,
			url: body.url,
			description: body.description,
			frontendVersion: body.frontendVersion || undefined,
			backendVersion: this.config.app.version,
			system: system ?? undefined,
			browser: browser ?? undefined,
			screen: this.formatScreen(body.screenWidth, body.screenHeight, body.pixelRatio),
			viewport: this.formatSize(body.viewportWidth, body.viewportHeight),
			display: body.displayMode ? BugReportDisplayModeLabels[body.displayMode] : undefined,
			pointer: body.pointer ? BugReportPointerLabels[body.pointer] : undefined,
			userAgent: userAgent || undefined,
		};
	}

	async sendBugReportEmail(report: BugReport, issue?: BugReportIssue | null): Promise<void> {
		const mail = BugReportMailTemplate(this.config.feedback.bugReportRecipient, {
			reporter: report.reporter,
			reporterUrl: report.reporterUrl,
			url: report.url,
			description: report.description,
			frontendVersion: report.frontendVersion,
			backendVersion: report.backendVersion,
			system: report.system,
			browser: report.browser,
			screen: report.screen,
			viewport: report.viewport,
			display: report.display,
			pointer: report.pointer,
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

		const suffix = ` (${report.reporterName})`;
		const { title, body } = this.splitDescription(report.description, suffix);
		const repo = this.config.github.bugReportRepo;

		try {
			const issue = await this.github.createIssue(repo, {
				title: `${title}${suffix}`,
				body: this.issueBody(report, body),
				labels: [this.config.github.bugReportLabel],
			});

			await this.recordBugReport(report.userId, repo, issue.number, title);

			this.logger.verbose(`Bug report filed as GitHub issue #${issue.number} (${issue.url}).`);
			return issue;
		} catch (err) {
			this.logger.error(`Failed to file bug report as a GitHub issue: ${(err as Error).message}`);
			throw new InternalServerErrorException("Bug report could not be filed as a GitHub issue.");
		}
	}

	async listBugReports(userId: number): Promise<BugReportResponse[]> {
		const reports = await this.bugReports.listBugReports(userId);
		if (!reports.length) return [];

		const released = new Map<string, string>();

		for (const repo of new Set(reports.map((report) => report.repo))) {
			for (const [issueNumber, issue] of await this.releaseIssuesService.getReleasedIssues(repo)) {
				released.set(this.issueKey(repo, issueNumber), issue.version);
			}
		}

		return reports.map((report) => {
			const releasedVersion = released.get(this.issueKey(report.repo, report.issueNumber)) ?? null;

			return {
				id: report.id,
				issueNumber: report.issueNumber,
				title: report.title,
				url: `https://github.com/${report.repo}/issues/${report.issueNumber}`,
				state: releasedVersion || report.notifiedAt ? BugReportStates.released : BugReportStates.open,
				releasedVersion,
				createdAt: report.createdAt,
				notifiedAt: report.notifiedAt,
			};
		});
	}

	private formatScreen(width?: number, height?: number, pixelRatio?: number): string | undefined {
		const css = this.formatSize(width, height);

		if (!css || !width || !height || !pixelRatio || pixelRatio === 1) return css;

		const ratio = String(Number(pixelRatio.toFixed(2))).replace(".", ",");
		const physical = `${Math.round(width * pixelRatio)} × ${Math.round(height * pixelRatio)} px`;

		return `≈ ${physical} (${css} @ ${ratio}×)`;
	}

	private formatSize(width?: number, height?: number): string | undefined {
		return width && height ? `${width} × ${height} px` : undefined;
	}

	private issueKey(repo: string, issueNumber: number): string {
		return `${repo}#${issueNumber}`;
	}

	private issueBody(report: BugReport, description: string): string {
		return [
			description || null,
			description ? "" : null,
			description ? "---" : null,
			description ? "" : null,
			`**Nahlásil:** [${report.reporter}](${report.reporterUrl})`,
			report.url ? `**URL:** ${report.url}` : null,
			`**Verze:** frontend ${report.frontendVersion ?? "neznámá"}, backend ${report.backendVersion}`,
			report.system ? `**Systém:** ${report.system}` : null,
			report.browser ? `**Prohlížeč:** ${report.browser}` : null,
			report.screen ? `**Obrazovka:** ${report.screen}` : null,
			report.viewport ? `**Okno:** ${report.viewport}` : null,
			report.display ? `**Zobrazení:** ${report.display}` : null,
			report.pointer ? `**Ovládání:** ${report.pointer}` : null,
			report.userAgent ? `**User agent:** \`${report.userAgent}\`` : null,
		]
			.filter((line) => line !== null)
			.join("\n");
	}

	private async recordBugReport(userId: number, repo: string, issueNumber: number, title: string) {
		try {
			await this.bugReports.createBugReport({ userId, repo, issueNumber, title });
		} catch (err) {
			this.logger.error(`Failed to record bug report for issue #${issueNumber}: ${(err as Error).message}`);
		}
	}

	private splitDescription(description: string, titleSuffix: string): { title: string; body: string } {
		const text = description.replace(/\r\n/g, "\n").trim();
		const breakIndex = text.indexOf("\n");

		const firstLine = (breakIndex === -1 ? text : text.slice(0, breakIndex)).trim();
		const otherLines = breakIndex === -1 ? "" : text.slice(breakIndex + 1).trim();

		const maxLength = Math.max(ISSUE_TITLE_MIN_TEXT_LENGTH, ISSUE_TITLE_MAX_LENGTH - titleSuffix.length);

		if (!firstLine) return { title: "Nahlášená chyba", body: otherLines };

		if (firstLine.length <= maxLength) return { title: firstLine, body: otherLines };

		const lastSpace = firstLine.lastIndexOf(" ", maxLength - 1);
		const cut = lastSpace > maxLength / 2 ? lastSpace : maxLength - 1;

		return {
			title: `${firstLine.slice(0, cut).trimEnd()}…`,
			body: [`…${firstLine.slice(cut).trim()}`, otherLines].filter(Boolean).join("\n"),
		};
	}
}
