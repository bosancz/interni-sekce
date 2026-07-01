import { Body, Controller, Post, Req, UseGuards } from "@nestjs/common";
import { ApiTags } from "@nestjs/swagger";
import { Request } from "express";
import { AcController } from "src/access-control/access-control-lib";
import { Token } from "src/auth/decorators/token.decorator";
import { UserGuard } from "src/auth/guards/user.guard";
import { TokenData } from "src/auth/schema/user-token";
import { Config } from "src/config";
import { MailService } from "src/models/mail/services/mail.service";
import { UsersRepository } from "src/models/users/repositories/users.repository";
import { SendBugReportPermission } from "../acl/feedback.acl";
import { BugReportBody } from "../dto/bug-report-body.dto";
import { BugReportMailTemplate } from "../mail-templates/bug-report/bug-report.mail-template";

@Controller("feedback")
@UseGuards(UserGuard)
@ApiTags("Feedback")
@AcController()
export class FeedbackController {
	constructor(
		private readonly mailService: MailService,
		private readonly users: UsersRepository,
		private readonly config: Config,
	) {}

	@Post("bug")
	async sendBugReport(@Req() req: Request, @Token() token: TokenData, @Body() body: BugReportBody) {
		SendBugReportPermission.canOrThrow(req);

		const user = await this.users.getUser(token.userId, { includeMember: true });

		const reporter = [user?.member?.nickname, user?.login && `<${user.login}>`].filter(Boolean).join(" ") || "neznámý";

		const mail = BugReportMailTemplate(this.config.feedback.bugReportRecipient, {
			reporter,
			environment: this.config.app.environmentTitle || this.config.environment,
			url: body.url,
			description: body.description,
		});

		await this.mailService.sendMail(mail);
	}
}
