import { Injectable } from "@angular/core";
import { Router } from "@angular/router";
import { ApiService } from "src/app/core/services/api.service";
import { ModalService } from "src/app/core/services/modal.service";
import { SDK } from "src/sdk";
import { BadgeRevealModalComponent } from "../components/badge-reveal-modal/badge-reveal-modal.component";
import { getUnseenBadges } from "../helpers/badges";

@Injectable({ providedIn: "root" })
export class AccountBadgesService {
	private revealing = false;

	constructor(
		private api: ApiService,
		private modalService: ModalService,
		private router: Router,
	) {}

	async load(): Promise<SDK.BadgeResponse[]> {
		return this.api.AccountApi.getMyBadges().then((res) => res.data);
	}

	async revealNew(badges: SDK.BadgeResponse[]): Promise<boolean> {
		const unseen = getUnseenBadges(badges);
		if (!unseen.length || this.revealing) return false;

		this.revealing = true;
		try {
			const result = await this.modalService.componentModal(
				BadgeRevealModalComponent,
				{ badges: unseen },
				{ cssClass: "dialog-brand" },
			);

			await this.api.AccountApi.markMyBadgesSeen();

			if (result === "list" && !this.router.url.startsWith("/ucet/odznaky"))
				await this.router.navigate(["/ucet/odznaky"]);
		} finally {
			this.revealing = false;
		}

		return true;
	}
}
