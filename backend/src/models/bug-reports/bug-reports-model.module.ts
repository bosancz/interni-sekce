import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { NotificationsModelModule } from "src/models/notifications/notifications-model.module";
import { BugReport } from "./entities/bug-report.entity";
import { BugReportsRepository } from "./repositories/bug-reports.repository";
import { ReleaseIssuesService } from "./services/release-issues.service";
import { ReleaseNotificationsService } from "./services/release-notifications.service";

@Module({
	imports: [TypeOrmModule.forFeature([BugReport]), NotificationsModelModule],
	providers: [BugReportsRepository, ReleaseIssuesService, ReleaseNotificationsService],
	exports: [BugReportsRepository, ReleaseIssuesService, ReleaseNotificationsService],
})
export class BugReportsModelModule {}
