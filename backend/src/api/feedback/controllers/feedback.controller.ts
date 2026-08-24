import { Body, Controller, Post, Req } from "@nestjs/common";
import { ApiTags } from "@nestjs/swagger";
import { Request } from "express";
import { AcController } from "src/access-control/access-control-lib";
import { AuthUser } from "src/auth/decorators/auth-user.decorator";
import { Authenticated } from "src/auth/decorators/authenticated.decorator";
import { SessionUser } from "src/auth/schema/user-token";
import { SendBugReportPermission } from "../acl/feedback.acl";
import { BugReportBody } from "../dto/bug-report-body.dto";
import { FeedbackService } from "../services/feedback.service";

@Controller("feedback")
@Authenticated()
@ApiTags("Feedback")
@AcController()
export class FeedbackController {
	constructor(private readonly feedback: FeedbackService) {}

	@Post("bug")
	async sendBugReport(@Req() req: Request, @AuthUser() authUser: SessionUser, @Body() body: BugReportBody) {
		SendBugReportPermission.canOrThrow(req);

		const report = await this.feedback.buildBugReport(authUser.userId, body);

		const issue = await this.feedback.fileBugReportIssue(report);

		await this.feedback.sendBugReportEmail(report, issue).catch(() => undefined);
	}
}
