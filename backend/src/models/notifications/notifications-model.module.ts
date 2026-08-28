import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { MailModelModule } from "src/models/mail/mail-model.module";
import { User } from "src/models/users/entities/user.entity";
import { NotificationSetting } from "./entities/notification-setting.entity";
import { NotificationSubscription } from "./entities/notification-subscription.entity";
import { Notification } from "./entities/notification.entity";
import { NotificationSettingsRepository } from "./repositories/notification-settings.repository";
import { NotificationSubscriptionsRepository } from "./repositories/notification-subscriptions.repository";
import { NotificationsRepository } from "./repositories/notifications.repository";
import { NotificationsService } from "./services/notifications.service";
import { PushService } from "./services/push.service";

@Module({
	imports: [
		TypeOrmModule.forFeature([NotificationSubscription, NotificationSetting, Notification, User]),
		MailModelModule,
	],
	providers: [
		NotificationsService,
		PushService,
		NotificationSettingsRepository,
		NotificationSubscriptionsRepository,
		NotificationsRepository,
	],
	exports: [
		NotificationsService,
		PushService,
		NotificationSettingsRepository,
		NotificationSubscriptionsRepository,
		NotificationsRepository,
	],
})
export class NotificationsModelModule {}
