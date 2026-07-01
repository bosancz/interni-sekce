import { Module } from "@nestjs/common";
import { UsersModelModule } from "src/models/users/users-model.module";
import { OauthController } from "./controllers/oauth.controller";
import { OauthService } from "./services/oauth.service";

@Module({
	controllers: [OauthController],
	imports: [UsersModelModule],
	providers: [OauthService],
})
export class OauthModule {}
