import { Module } from "@nestjs/common";
import { CmsAuthController } from "./controllers/cms-auth.controller";
import { CmsAuthService } from "./services/cms-auth.service";

@Module({
	controllers: [CmsAuthController],
	providers: [CmsAuthService],
})
export class CmsAuthModule {}
