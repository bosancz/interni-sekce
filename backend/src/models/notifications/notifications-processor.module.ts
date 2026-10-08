import { Module } from "@nestjs/common";
import { NotificationsModelModule } from "./notifications-model.module";
import { NotificationsProcessor } from "./processors/notifications.processor";

@Module({
	imports: [NotificationsModelModule],
	providers: [NotificationsProcessor],
})
export class NotificationsProcessorModule {}
