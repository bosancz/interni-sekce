import { Injectable, signal } from "@angular/core";
import { SwPush } from "@angular/service-worker";
import { ApiService } from "src/app/core/services/api.service";

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
	) {
		this.api.rootLinks.subscribe((links) => {
			this.allowed = links.getUnreadNotificationsCount?.allowed ?? false;

			if (this.allowed) this.loadUnreadCount();
			else this.count.set(0);
		});

		this.swPush.messages.subscribe(() => this.loadUnreadCount());
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
}
