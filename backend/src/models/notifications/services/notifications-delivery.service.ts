import { Injectable } from "@nestjs/common";
import { MailOptions } from "src/models/mail/schema/mail-options";
import { MailService } from "src/models/mail/services/mail.service";
import { NotificationSubscriptionsRepository } from "../repositories/notification-subscriptions.repository";
import { PushService } from "./push.service";

@Injectable()
export class NotificationsDeliveryService {
	constructor(
		private notificationSubscriptions: NotificationSubscriptionsRepository,
		private pushService: PushService,
		private mailService: MailService,
	) {}

	async sendEmail(mail: MailOptions) {
		await this.mailService.sendMail(mail);
	}

	async sendPush(subscriptionId: number, payload: object) {
		const subscription = await this.notificationSubscriptions.getSendableSubscription(subscriptionId);
		if (!subscription) return;

		const alive = await this.pushService.send(
			{
				endpoint: subscription.endpoint!,
				keyP256dh: subscription.keyP256dh!,
				keyAuth: subscription.keyAuth!,
			},
			payload,
		);

		if (!alive) await this.notificationSubscriptions.deleteSubscription(subscription.id);
	}
}
