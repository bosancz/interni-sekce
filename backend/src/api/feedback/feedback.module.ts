import { Module } from "@nestjs/common";
import { GithubModelModule } from "src/models/github/github-model.module";
import { MailModelModule } from "src/models/mail/mail-model.module";
import { UsersModelModule } from "src/models/users/users-model.module";
import { FeedbackController } from "./controllers/feedback.controller";

@Module({
	controllers: [FeedbackController],
	imports: [MailModelModule, UsersModelModule, GithubModelModule],
})
export class FeedbackModule {}
