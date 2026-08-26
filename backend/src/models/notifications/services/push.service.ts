import { Injectable, Logger } from "@nestjs/common";
import { Config } from "src/config";
import webpush, { WebPushError } from "web-push";

export interface PushSubscriptionKeys {
	endpoint: string;
	keyP256dh: string;
	keyAuth: string;
}

@Injectable()
export class PushService {
	private readonly logger = new Logger(PushService.name);

	constructor(private readonly config: Config) {
		if (this.isConfigured) {
			webpush.setVapidDetails(config.push.subject, config.push.publicKey, config.push.privateKey);
		} else {
			this.logger.warn("VAPID keys are not set, push notifications are disabled.");
		}
	}

	get isConfigured() {
		return !!(this.config.push.publicKey && this.config.push.privateKey);
	}

	get publicKey() {
		return this.isConfigured ? this.config.push.publicKey : null;
	}

	async send(subscription: PushSubscriptionKeys, payload: object): Promise<boolean> {
		if (!this.isConfigured) return true;

		try {
			await webpush.sendNotification(
				{
					endpoint: subscription.endpoint,
					keys: { p256dh: subscription.keyP256dh, auth: subscription.keyAuth },
				},
				JSON.stringify(payload),
			);
			return true;
		} catch (err) {
			if (err instanceof WebPushError && [404, 410].includes(err.statusCode)) return false;
			throw err;
		}
	}
}
