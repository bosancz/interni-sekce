import { BullModule } from "@nestjs/bullmq";
import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { MailModelModule } from "src/models/mail/mail-model.module";
import { User } from "src/models/users/entities/user.entity";
import { NotificationSetting } from "./entities/notification-setting.entity";
import { NotificationSubscription } from "./entities/notification-subscription.entity";
import { Notification } from "./entities/notification.entity";
import { NOTIFICATIONS_QUEUE } from "./notifications-queue";
import { NotificationSettingsRepository } from "./repositories/notification-settings.repository";
import { NotificationSubscriptionsRepository } from "./repositories/notification-subscriptions.repository";
import { NotificationsRepository } from "./repositories/notifications.repository";
import { NotificationsDeliveryService } from "./services/notifications-delivery.service";
import { NotificationsQueueService } from "./services/notifications-queue.service";
import { NotificationsService } from "./services/notifications.service";
import { PushService } from "./services/push.service";

@Module({
	imports: [
		TypeOrmModule.forFeature([NotificationSubscription, NotificationSetting, Notification, User]),
		MailModelModule,
		BullModule.registerQueue({ name: NOTIFICATIONS_QUEUE }),
	],
	providers: [
		NotificationsService,
		NotificationsDeliveryService,
		NotificationsQueueService,
		PushService,
		NotificationSettingsRepository,
		NotificationSubscriptionsRepository,
		NotificationsRepository,
	],
	exports: [
		NotificationsService,
		NotificationsDeliveryService,
		PushService,
		NotificationSettingsRepository,
		NotificationSubscriptionsRepository,
		NotificationsRepository,
	],
})
export class NotificationsModelModule {}
