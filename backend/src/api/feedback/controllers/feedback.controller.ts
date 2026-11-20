import { Body, Controller, Get, Post, Req } from "@nestjs/common";
import { ApiResponse, ApiTags } from "@nestjs/swagger";
import { Request } from "express";
import { AcController, AcLinks, WithLinks } from "src/access-control/access-control-lib";
import { AuthUser } from "src/auth/decorators/auth-user.decorator";
import { Authenticated } from "src/auth/decorators/authenticated.decorator";
import { SessionUser } from "src/auth/schema/user-token";
import { ListBugReportsPermission, SendBugReportPermission } from "../acl/feedback.acl";
import { BugReportBody } from "../dto/bug-report-body.dto";
import { BugReportResponse } from "../dto/bug-report-response.dto";
import { BugReportSendResponse } from "../dto/bug-report-send-response.dto";
import { FeedbackService } from "../services/feedback.service";

@Controller("feedback")
@Authenticated()
@ApiTags("Feedback")
@AcController()
export class FeedbackController {
	constructor(private readonly feedback: FeedbackService) {}

	@Post("bug")
	@AcLinks(SendBugReportPermission)
	@ApiResponse({ status: 201, type: BugReportSendResponse })
	async sendBugReport(
		@Req() req: Request,
		@AuthUser() authUser: SessionUser,
		@Body() body: BugReportBody,
	): Promise<BugReportSendResponse> {
		SendBugReportPermission.canOrThrow(req);

		const report = await this.feedback.buildBugReport(authUser.userId, body, req.headers["user-agent"]);

		const issue = await this.feedback.fileBugReportIssue(report);

		if (!issue) await this.feedback.sendBugReportEmail(report).catch(() => undefined);

		return { issueNumber: issue?.number ?? null, issueUrl: issue?.url ?? null };
	}

	@Get("bugs")
	@AcLinks(ListBugReportsPermission)
	@ApiResponse({ status: 200, type: WithLinks(BugReportResponse), isArray: true })
	async listBugReports(@Req() req: Request, @AuthUser() authUser: SessionUser): Promise<BugReportResponse[]> {
		ListBugReportsPermission.canOrThrow(req);

		return this.feedback.listBugReports(authUser.userId);
	}
}
