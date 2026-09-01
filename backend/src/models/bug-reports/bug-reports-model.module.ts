import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { NotificationsModelModule } from "src/models/notifications/notifications-model.module";
import { BugReport } from "./entities/bug-report.entity";
import { BugReportsRepository } from "./repositories/bug-reports.repository";
import { ReleaseNotificationsService } from "./services/release-notifications.service";

@Module({
	imports: [TypeOrmModule.forFeature([BugReport]), NotificationsModelModule],
	providers: [BugReportsRepository, ReleaseNotificationsService],
	exports: [BugReportsRepository, ReleaseNotificationsService],
})
export class BugReportsModelModule {}
