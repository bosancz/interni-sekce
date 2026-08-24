import { Module } from "@nestjs/common";
import { RootController } from "./controllers/root.controller";
import { ChangelogService } from "./services/changelog.service";

@Module({
	controllers: [RootController],
	providers: [ChangelogService],
})
export class RootModule {}
