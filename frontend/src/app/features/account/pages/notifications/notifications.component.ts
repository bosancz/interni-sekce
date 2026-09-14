import { Component, OnInit, computed, signal } from "@angular/core";
import { DatePipe } from "@angular/common";
import { Router } from "@angular/router";
import { IonBackButton, IonButtons, IonIcon } from "@ionic/angular/standalone";
import { addIcons } from "ionicons";
import { checkmarkDoneOutline, notificationsOffOutline, settingsOutline } from "ionicons/icons";
import { ApiService } from "src/app/core/services/api.service";
import { Action } from "src/app/shared/components/action-buttons/action-buttons.component";
import { CardContentComponent } from "src/app/shared/components/card-content/card-content.component";
import { CardComponent } from "src/app/shared/components/card/card.component";
import { PageContentComponent } from "src/app/shared/components/page-content/page-content.component";
import { PageHeaderComponent } from "src/app/shared/components/page-header/page-header.component";
import { SDK } from "src/sdk";

@Component({
	selector: "bo-notifications",
	templateUrl: "./notifications.component.html",
	styleUrls: ["./notifications.component.scss"],
	imports: [
		DatePipe,
		IonBackButton,
		IonButtons,
		IonIcon,
		PageHeaderComponent,
		PageContentComponent,
		CardComponent,
		CardContentComponent,
	],
})
export class NotificationsComponent implements OnInit {
	notifications = signal<SDK.NotificationResponseWithLinks[] | undefined>(undefined);

	unreadCount = computed(() => this.notifications()?.filter((item) => !item.readAt).length ?? 0);

	actions = computed<Action[]>(() => [
		{
			text: "Označit vše jako přečtené",
			icon: "checkmark-done-outline",
			pinned: true,
			hidden: !this.unreadCount() || !this.api.links()?.markAllNotificationsRead?.allowed,
			handler: () => this.markAllRead(),
		},
		{
			text: "Nastavení notifikací",
			icon: "settings-outline",
			pinned: true,
			handler: () => this.router.navigate(["/ucet/notifikace/nastaveni"]),
		},
	]);

	constructor(
		private api: ApiService,
		private router: Router,
	) {
		addIcons({ settingsOutline, checkmarkDoneOutline, notificationsOffOutline });
	}

	ngOnInit() {
		this.loadNotifications();
	}

	async loadNotifications() {
		const notifications = await this.api.NotificationsApi.listNotifications().then((res) => res.data);
		this.notifications.set(notifications);
	}

	async openNotification(notification: SDK.NotificationResponseWithLinks) {
		if (!notification.readAt && notification._links.markNotificationRead.allowed) {
			this.api.NotificationsApi.markNotificationRead(notification.id).catch(() => undefined);
			this.notifications.update((items) =>
				items?.map((item) =>
					item.id === notification.id ? { ...item, readAt: new Date().toISOString() } : item,
				),
			);
		}

		if (notification.path) await this.router.navigateByUrl(notification.path);
	}

	async markAllRead() {
		await this.api.NotificationsApi.markAllNotificationsRead();
		this.notifications.update((items) =>
			items?.map((item) => (item.readAt ? item : { ...item, readAt: new Date().toISOString() })),
		);
	}
}
