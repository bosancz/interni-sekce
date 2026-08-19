import { Component, OnInit } from "@angular/core";
import { SwPush } from "@angular/service-worker";
import { ApiService } from "src/app/core/services/api.service";
import { ToastService } from "src/app/core/services/toast.service";
import { SDK } from "src/sdk";

declare const Notification: any;

@Component({
	selector: "bo-account-notifications",
	templateUrl: "./account-notifications.component.html",
	styleUrls: ["./account-notifications.component.scss"],
	imports: [],
})
export class AccountNotificationsComponent implements OnInit {
	user?: SDK.AccountResponseWithLinks;

	notifications = [
		{ id: "new-event", name: "Nová událost" },
		{ id: "new-gallery", name: "Nová galerie" },
		{ id: "changed-event", name: "Změna události" },
		{ id: "received-payment", name: "Přijatá platba" },
	];

	userNotifications: { [id: string]: any } = {};

	systemNotificationStatus: string = "default";

	constructor(
		private api: ApiService,
		public swPush: SwPush,
		private toastService: ToastService,
	) {}

	ngOnInit() {
		this.loadUser();
		this.updateSystemNotificationStatus();
	}

	async loadUser() {
		this.user = await this.api.AccountApi.getMe().then((res) => res.data);
		this.updateNotifications();
	}

	async subscribe() {
		// TODO: notifications
	}

	async unsubscribe() {
		await this.swPush.unsubscribe();
		this.toastService.toast("Notifikace byly vypnuty.");
	}

	updateNotifications() {
		this.userNotifications = {};
	}

	updateSystemNotificationStatus() {
		this.systemNotificationStatus = (Notification && Notification.permission) || "unavailable";
	}

	async requestNotificationPermission() {
		const permission = await Notification.requestPermission();
		this.systemNotificationStatus = permission;
	}
}
