import { Injectable } from "@angular/core";
import { SwPush } from "@angular/service-worker";
import { filter, firstValueFrom } from "rxjs";
import { ApiService } from "src/app/core/services/api.service";
import { UserService } from "src/app/core/services/user.service";
import { SDK } from "src/sdk";

const DEVICE_ID_KEY = "notificationsDeviceId";

@Injectable({
	providedIn: "root",
})
export class PushNotificationsService {
	constructor(
		private api: ApiService,
		private swPush: SwPush,
		private userService: UserService,
	) {
		this.syncSubscription();
	}

	get isSupported() {
		return this.swPush.isEnabled && "Notification" in window;
	}

	get permission(): NotificationPermission | "unsupported" {
		return "Notification" in window ? Notification.permission : "unsupported";
	}

	get deviceId(): string | null {
		return localStorage.getItem(DEVICE_ID_KEY);
	}

	async requestPermission(): Promise<NotificationPermission> {
		return Notification.requestPermission();
	}

	async subscribeCurrentDevice(vapidPublicKey: string): Promise<SDK.NotificationDeviceResponseWithLinks> {
		const subscription = await this.swPush.requestSubscription({ serverPublicKey: vapidPublicKey });

		let deviceId = this.deviceId;
		if (!deviceId) {
			deviceId = crypto.randomUUID();
			localStorage.setItem(DEVICE_ID_KEY, deviceId);
		}

		const device = await this.api.NotificationsApi.subscribeNotificationDevice(
			this.createSubscribeBody(deviceId, subscription),
		).then((res) => res.data);

		return device;
	}

	async unsubscribeCurrentDevice() {
		await this.swPush.unsubscribe().catch(() => undefined);
	}

	private async syncSubscription() {
		if (!this.swPush.isEnabled) return;

		const deviceId = this.deviceId;
		if (!deviceId) return;

		await firstValueFrom(this.userService.user.pipe(filter((user) => !!user)));

		const subscription = await firstValueFrom(this.swPush.subscription);
		if (!subscription) return;

		const devices = await this.api.NotificationsApi.listNotificationDevices().then((res) => res.data);
		if (!devices.some((device) => device.deviceId === deviceId)) return;

		await this.api.NotificationsApi.subscribeNotificationDevice(this.createSubscribeBody(deviceId, subscription));
	}

	private createSubscribeBody(deviceId: string, subscription: PushSubscription): SDK.NotificationSubscribeBody {
		const json = subscription.toJSON();
		if (!json.endpoint || !json.keys?.["p256dh"] || !json.keys?.["auth"]) {
			throw new Error("Push subscription is missing endpoint or keys.");
		}

		return {
			deviceId,
			deviceName: this.getDeviceName(),
			endpoint: json.endpoint,
			keys: { p256dh: json.keys["p256dh"], auth: json.keys["auth"] },
		};
	}

	private getDeviceName() {
		const ua = navigator.userAgent;

		const browser = ua.includes("Edg/")
			? "Edge"
			: ua.includes("OPR/")
				? "Opera"
				: ua.includes("Chrome/")
					? "Chrome"
					: ua.includes("Firefox/")
						? "Firefox"
						: ua.includes("Safari/")
							? "Safari"
							: "Prohlížeč";

		const os = ua.includes("Android")
			? "Android"
			: /iPhone|iPad|iPod/.test(ua)
				? "iOS"
				: ua.includes("Windows")
					? "Windows"
					: ua.includes("Mac OS")
						? "macOS"
						: ua.includes("Linux")
							? "Linux"
							: null;

		return os ? `${browser} – ${os}` : browser;
	}
}
