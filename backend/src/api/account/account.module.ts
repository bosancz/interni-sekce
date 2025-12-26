import { Module } from "@nestjs/common";
import { GoogleModelModule } from "src/models/google/google-model.module";
import { MailModelModule } from "src/models/mail/mail-model.module";
import { UsersModelModule } from "src/models/users/users-model.module";
import { AccountController } from "./controllers/account.controller";
import { LoginController } from "./controllers/login.controller";

@Module({
	controllers: [AccountController, LoginController],
	imports: [UsersModelModule, MailModelModule, GoogleModelModule],
})
export class AccountModule {}
