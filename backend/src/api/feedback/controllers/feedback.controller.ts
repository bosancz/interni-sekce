import { Body, Controller, Logger, Post, Req } from "@nestjs/common";
import { ApiTags } from "@nestjs/swagger";
import { Request } from "express";
import { AcController } from "src/access-control/access-control-lib";
import { AuthUser } from "src/auth/decorators/auth-user.decorator";
import { Authenticated } from "src/auth/decorators/authenticated.decorator";
import { SessionUser } from "src/auth/schema/user-token";
import { Config } from "src/config";
import { GithubService } from "src/models/github/services/github.service";
import { MailService } from "src/models/mail/services/mail.service";
import { UsersRepository } from "src/models/users/repositories/users.repository";
import { SendBugReportPermission } from "../acl/feedback.acl";
import { BugReportBody } from "../dto/bug-report-body.dto";
import { BugReportMailTemplate } from "../mail-templates/bug-report/bug-report.mail-template";

@Controller("feedback")
@Authenticated()
@ApiTags("Feedback")
@AcController()
export class FeedbackController {
	private readonly logger = new Logger(FeedbackController.name);

	constructor(
		private readonly mailService: MailService,
		private readonly github: GithubService,
		private readonly users: UsersRepository,
		private readonly config: Config,
	) {}

	@Post("bug")
	async sendBugReport(@Req() req: Request, @AuthUser() authUser: SessionUser, @Body() body: BugReportBody) {
		SendBugReportPermission.canOrThrow(req);

		const user = await this.users.getUser(authUser.userId, { includeMember: true });

		const reporter = [user?.member?.nickname, user?.login && `<${user.login}>`].filter(Boolean).join(" ") || "neznámý";
		const environment = this.config.app.environmentTitle || this.config.environment;

		const mail = BugReportMailTemplate(this.config.feedback.bugReportRecipient, {
			reporter,
			environment,
			url: body.url,
			description: body.description,
		});

		await this.mailService.sendMail(mail);

		// Also file the report as a GitHub issue. This is best-effort: a misconfigured or
		// unreachable GitHub must not fail the report, which has already been delivered by mail.
		await this.fileGithubIssue({ reporter, environment, url: body.url, description: body.description });
	}

	private async fileGithubIssue(params: {
		reporter: string;
		environment: string;
		url?: string;
		description: string;
	}): Promise<void> {
		if (!this.github.isConfigured) return;

		try {
			const issueBody = [
				`**Nahlásil:** ${params.reporter}`,
				`**Prostředí:** ${params.environment}`,
				params.url ? `**URL:** ${params.url}` : null,
				"",
				"---",
				"",
				params.description,
			]
				.filter((line) => line !== null)
				.join("\n");

			const issue = await this.github.createIssue(this.config.github.bugReportRepo, {
				title: this.issueTitle(params.description, this.config.app.environmentTitle),
				body: issueBody,
				labels: [this.config.github.bugReportLabel],
			});

			this.logger.log(`Bug report filed as GitHub issue #${issue.number} (${issue.url}).`);
		} catch (err) {
			this.logger.error(`Failed to file bug report as a GitHub issue: ${(err as Error).message}`);
		}
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
