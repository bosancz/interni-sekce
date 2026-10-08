import { Module } from "@nestjs/common";
import { RootController } from "./controllers/root.controller";
import { ChangelogService } from "./services/changelog.service";
import { HealthService } from "./services/health.service";

@Module({
	controllers: [RootController],
	providers: [ChangelogService, HealthService],
})
export class RootModule {}
