import { Module } from "@nestjs/common";
import { BadgesModelModule } from "src/models/badges/badges-model.module";
import { GoogleModelModule } from "src/models/google/google-model.module";
import { MailModelModule } from "src/models/mail/mail-model.module";
import { UsersModelModule } from "src/models/users/users-model.module";
import { AccountBadgesController } from "./controllers/account-badges.controller";
import { AccountController } from "./controllers/account.controller";
import { LoginController } from "./controllers/login.controller";

@Module({
	controllers: [AccountController, AccountBadgesController, LoginController],
	imports: [UsersModelModule, BadgesModelModule, MailModelModule, GoogleModelModule],
})
export class AccountModule {}
