import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { MailModelModule } from "src/models/mail/mail-model.module";
import { User } from "src/models/users/entities/user.entity";
import { NotificationSetting } from "./entities/notification-setting.entity";
import { NotificationSubscription } from "./entities/notification-subscription.entity";
import { NotificationSettingsRepository } from "./repositories/notification-settings.repository";
import { NotificationSubscriptionsRepository } from "./repositories/notification-subscriptions.repository";
import { NotificationsService } from "./services/notifications.service";
import { PushService } from "./services/push.service";

@Module({
	imports: [TypeOrmModule.forFeature([NotificationSubscription, NotificationSetting, User]), MailModelModule],
	providers: [NotificationsService, PushService, NotificationSettingsRepository, NotificationSubscriptionsRepository],
	exports: [NotificationsService, PushService, NotificationSettingsRepository, NotificationSubscriptionsRepository],
})
export class NotificationsModelModule {}
