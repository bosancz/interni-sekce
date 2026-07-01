import { Module } from "@nestjs/common";
import { MailModelModule } from "src/models/mail/mail-model.module";
import { UsersModelModule } from "src/models/users/users-model.module";
import { FeedbackController } from "./controllers/feedback.controller";

@Module({
	controllers: [FeedbackController],
	imports: [MailModelModule, UsersModelModule],
})
export class FeedbackModule {}
