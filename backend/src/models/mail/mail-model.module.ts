import { Module } from "@nestjs/common";
import { GoogleModelModule } from "../google/google-model.module";
import { MailService } from "./services/mail.service";

@Module({
  imports: [GoogleModelModule],
  providers: [MailService],
  exports: [MailService],
})
export class MailModelModule {}
