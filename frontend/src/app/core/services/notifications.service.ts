import { effect, Injectable, signal } from "@angular/core";
import { NavigationEnd, Router } from "@angular/router";
import { SwPush } from "@angular/service-worker";
import { filter } from "rxjs";
import { ApiService } from "src/app/core/services/api.service";

const NOTIFICATION_QUERY_PARAM = "notifikace";

@Injectable({
	providedIn: "root",
})
export class NotificationsService {
	private readonly count = signal(0);

	private allowed = false;

	readonly unreadCount = this.count.asReadonly();

	constructor(
		private api: ApiService,
		private swPush: SwPush,
		private router: Router,
	) {
		this.api.rootLinks.subscribe((links) => {
			this.allowed = links.getUnreadNotificationsCount?.allowed ?? false;

			if (this.allowed) this.loadUnreadCount();
			else this.count.set(0);
		});

		this.swPush.messages.subscribe(() => this.loadUnreadCount());

		effect(() => this.updateAppBadge(this.count()));

		this.router.events
			.pipe(filter((event) => event instanceof NavigationEnd))
			.subscribe((event) => this.markOpenedNotification(event.urlAfterRedirects));
	}

	setUnreadCount(count: number) {
		this.count.set(count);
	}

	async loadUnreadCount() {
		if (!this.allowed) return;

		const count = await this.api.NotificationsApi.getUnreadNotificationsCount()
			.then((res) => res.data.count)
			.catch(() => undefined);

		if (count !== undefined) this.count.set(count);
	}

	private markOpenedNotification(url: string) {
		const tree = this.router.parseUrl(url);
		if (!(NOTIFICATION_QUERY_PARAM in tree.queryParams)) return;

		const notificationId = Number(tree.queryParams[NOTIFICATION_QUERY_PARAM]);

		delete tree.queryParams[NOTIFICATION_QUERY_PARAM];
		this.router.navigateByUrl(tree, { replaceUrl: true });

		if (!Number.isInteger(notificationId)) return;

		this.api.NotificationsApi.markNotificationRead(notificationId)
			.then(() => this.loadUnreadCount())
			.catch(() => undefined);
	}

	private updateAppBadge(count: number) {
		if (!("setAppBadge" in navigator)) return;

		const request = count > 0 ? navigator.setAppBadge(count) : navigator.clearAppBadge();
		request.catch(() => {});
	}
}
