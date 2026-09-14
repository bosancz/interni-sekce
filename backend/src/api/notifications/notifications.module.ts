import { Module } from "@nestjs/common";
import { NotificationsModelModule } from "src/models/notifications/notifications-model.module";
import { AccountNotificationsController } from "./controllers/account-notifications.controller";

@Module({
	imports: [NotificationsModelModule],
	controllers: [AccountNotificationsController],
})
export class NotificationsModule {}
