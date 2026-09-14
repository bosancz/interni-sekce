import { Component, OnInit, computed, signal } from "@angular/core";
import { DatePipe } from "@angular/common";
import { IonBackButton, IonButton, IonButtons, IonIcon, IonSpinner, IonToggle } from "@ionic/angular/standalone";
import { addIcons } from "ionicons";
import {
	addOutline,
	laptopOutline,
	notificationsOutline,
	paperPlaneOutline,
	phonePortraitOutline,
} from "ionicons/icons";
import { ApiService } from "src/app/core/services/api.service";
import { ModalService } from "src/app/core/services/modal.service";
import { PushNotificationsService } from "src/app/core/services/push-notifications.service";
import { ToastService } from "src/app/core/services/toast.service";
import { CardContentComponent } from "src/app/shared/components/card-content/card-content.component";
import { CardHeaderComponent } from "src/app/shared/components/card-header/card-header.component";
import { CardTitleComponent } from "src/app/shared/components/card-title/card-title.component";
import { CardComponent } from "src/app/shared/components/card/card.component";
import { DeleteButtonComponent } from "src/app/shared/components/delete-button/delete-button.component";
import { PageContentComponent } from "src/app/shared/components/page-content/page-content.component";
import { PageHeaderComponent } from "src/app/shared/components/page-header/page-header.component";
import { SDK } from "src/sdk";

@Component({
	selector: "bo-notification-settings",
	templateUrl: "./notification-settings.component.html",
	styleUrls: ["./notification-settings.component.scss"],
	imports: [
		DatePipe,
		IonBackButton,
		IonButton,
		IonButtons,
		IonIcon,
		IonSpinner,
		IonToggle,
		PageHeaderComponent,
		PageContentComponent,
		CardComponent,
		CardHeaderComponent,
		CardTitleComponent,
		CardContentComponent,
		DeleteButtonComponent,
	],
})
export class NotificationSettingsComponent implements OnInit {
	settings = signal<SDK.NotificationSettingsResponseWithLinks | undefined>(undefined);
	devices = signal<SDK.NotificationDeviceResponseWithLinks[] | undefined>(undefined);

	permission = signal(this.pushNotificationsService.permission);

	subscribing = signal(false);
	savingTypes = signal<SDK.NotificationTypesEnum[]>([]);
	testingDevices = signal<number[]>([]);

	channels = SDK.NotificationChannelsEnum;

	pushSupported = this.pushNotificationsService.isSupported;

	currentDevice = computed(() =>
		this.devices()?.find((device) => device.deviceId === this.pushNotificationsService.deviceId),
	);

	constructor(
		private api: ApiService,
		private pushNotificationsService: PushNotificationsService,
		private toastService: ToastService,
		private modalService: ModalService,
	) {
		addIcons({ notificationsOutline, phonePortraitOutline, laptopOutline, paperPlaneOutline, addOutline });
	}

	ngOnInit() {
		this.loadData();
	}

	async loadData() {
		const settings = await this.api.NotificationsApi.getNotificationSettings().then((res) => res.data);
		this.settings.set(settings);

		if (settings._links.listNotificationDevices.allowed) {
			const devices = await this.api.NotificationsApi.listNotificationDevices().then((res) => res.data);
			this.devices.set(devices);
		}
	}

	hasChannel(type: SDK.NotificationTypeSettingResponseWithLinks, channel: SDK.NotificationChannelsEnum) {
		return type.channels.includes(channel);
	}

	isChannelForced(type: SDK.NotificationTypeSettingResponseWithLinks, channel: SDK.NotificationChannelsEnum) {
		return (
			channel === SDK.NotificationChannelsEnum.InApp &&
			(this.hasChannel(type, SDK.NotificationChannelsEnum.Push) ||
				this.hasChannel(type, SDK.NotificationChannelsEnum.Email))
		);
	}

	async setChannel(
		type: SDK.NotificationTypeSettingResponseWithLinks,
		channel: SDK.NotificationChannelsEnum,
		enabled: boolean,
	) {
		const channels = new Set(type.channels);
		if (enabled) channels.add(channel);
		else channels.delete(channel);

		if (channels.has(SDK.NotificationChannelsEnum.Push) || channels.has(SDK.NotificationChannelsEnum.Email)) {
			channels.add(SDK.NotificationChannelsEnum.InApp);
		}

		this.savingTypes.update((types) => [...types, type.type]);

		try {
			await this.api.NotificationsApi.updateNotificationSetting(type.type, { channels: [...channels] });

			this.settings.update((settings) =>
				settings
					? {
							...settings,
							types: settings.types.map((item) =>
								item.type === type.type ? { ...item, channels: [...channels] } : item,
							),
						}
					: settings,
			);
		} catch {
			this.toastService.toast("Nastavení se nepodařilo uložit.", { color: "danger" });
		} finally {
			this.savingTypes.update((types) => types.filter((item) => item !== type.type));
		}
	}

	async subscribeCurrentDevice() {
		const vapidPublicKey = this.settings()?.vapidPublicKey;
		if (!vapidPublicKey) return;

		this.subscribing.set(true);

		try {
			const permission = await this.pushNotificationsService.requestPermission();
			this.permission.set(permission);
			if (permission !== "granted") return;

			await this.pushNotificationsService.subscribeCurrentDevice(vapidPublicKey);
			await this.loadData();

			this.toastService.toast("Upozornění na tomto zařízení byla zapnuta.");
		} catch {
			this.toastService.toast("Upozornění se nepodařilo zapnout.", { color: "danger" });
		} finally {
			this.subscribing.set(false);
		}
	}

	async testDevice(device: SDK.NotificationDeviceResponseWithLinks) {
		this.testingDevices.update((ids) => [...ids, device.id]);

		try {
			await this.api.NotificationsApi.testNotificationDevice(device.id);
			this.toastService.toast("Zkušební upozornění bylo odesláno.");
		} catch {
			this.toastService.toast("Zkušební upozornění se nepodařilo odeslat.", { color: "danger" });
			await this.loadData();
		} finally {
			this.testingDevices.update((ids) => ids.filter((id) => id !== device.id));
		}
	}

	async deleteDevice(device: SDK.NotificationDeviceResponseWithLinks) {
		const confirmed = await this.modalService.deleteConfirmationModal(
			`Opravdu chceš vypnout upozornění na zařízení „${device.deviceName ?? "Neznámé zařízení"}“?`,
		);
		if (!confirmed) return;

		await this.api.NotificationsApi.deleteNotificationDevice(device.id);

		if (device.deviceId === this.pushNotificationsService.deviceId) {
			await this.pushNotificationsService.unsubscribeCurrentDevice();
		}

		await this.loadData();

		this.toastService.toast("Zařízení bylo odebráno.");
	}
}
