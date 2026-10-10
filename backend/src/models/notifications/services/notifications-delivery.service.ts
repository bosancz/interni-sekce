import { Injectable } from "@nestjs/common";
import { MailOptions } from "src/models/mail/schema/mail-options";
import { MailService } from "src/models/mail/services/mail.service";
import { NotificationSubscriptionsRepository } from "../repositories/notification-subscriptions.repository";
import { NotificationsRepository } from "../repositories/notifications.repository";
import { NotificationPushPayload } from "./notifications-queue.service";
import { PushService } from "./push.service";

@Injectable()
export class NotificationsDeliveryService {
	constructor(
		private notificationSubscriptions: NotificationSubscriptionsRepository,
		private notifications: NotificationsRepository,
		private pushService: PushService,
		private mailService: MailService,
	) {}

	async sendEmail(mail: MailOptions) {
		await this.mailService.sendMail(mail);
	}

	async sendPush(subscriptionId: number, payload: NotificationPushPayload) {
		const subscription = await this.notificationSubscriptions.getSendableSubscription(subscriptionId);
		if (!subscription) return;

		const unreadCount = await this.notifications.countUnread(subscription.userId);

		const alive = await this.pushService.send(
			{
				endpoint: subscription.endpoint!,
				keyP256dh: subscription.keyP256dh!,
				keyAuth: subscription.keyAuth!,
			},
			{
				...payload,
				notification: { ...payload.notification, data: { ...payload.notification.data, unreadCount } },
			},
		);

		if (!alive) await this.notificationSubscriptions.deleteSubscription(subscription.id);
	}
}
