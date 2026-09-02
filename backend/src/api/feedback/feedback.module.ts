import { Module } from "@nestjs/common";
import { BugReportsModelModule } from "src/models/bug-reports/bug-reports-model.module";
import { GithubModelModule } from "src/models/github/github-model.module";
import { MailModelModule } from "src/models/mail/mail-model.module";
import { UsersModelModule } from "src/models/users/users-model.module";
import { FeedbackController } from "./controllers/feedback.controller";
import { FeedbackService } from "./services/feedback.service";

@Module({
	controllers: [FeedbackController],
	imports: [MailModelModule, UsersModelModule, GithubModelModule, BugReportsModelModule],
	providers: [FeedbackService],
})
export class FeedbackModule {}
