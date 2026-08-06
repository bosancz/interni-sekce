import { Component, computed, effect, signal } from "@angular/core";
import { RouterLink } from "@angular/router";
import { IonItem, IonLabel, IonList, IonSkeletonText } from "@ionic/angular/standalone";
import { I18nPluralPipe } from "@angular/common";
import { ApiService } from "src/app/core/services/api.service";
import { CardContentComponent } from "src/app/shared/components/card-content/card-content.component";
import { CardHeaderComponent } from "src/app/shared/components/card-header/card-header.component";
import { CardTitleComponent } from "src/app/shared/components/card-title/card-title.component";
import { CardComponent } from "src/app/shared/components/card/card.component";
import { GroupBadgeComponent } from "src/app/shared/components/group-badge/group-badge.component";
import { SDK } from "src/sdk";

/** How many leaders the ranking shows. */
const TOP_LEADERS_LIMIT = 5;

export type RankedLeader = SDK.TopLeaderResponse & { rank: number };

@Component({
	selector: "bo-home-card-top-leaders",
	templateUrl: "./home-card-top-leaders.component.html",
	styleUrls: ["./home-card-top-leaders.component.scss"],

	imports: [
		RouterLink,
		I18nPluralPipe,
		IonList,
		IonItem,
		IonLabel,
		IonSkeletonText,
		CardComponent,
		CardHeaderComponent,
		CardTitleComponent,
		CardContentComponent,
		GroupBadgeComponent,
	],
})
export class HomeCardTopLeadersComponent {
	/** `undefined` until the ranking is loaded, so the card can show its skeleton rows. */
	leaders = signal<RankedLeader[] | undefined>(undefined);

	/** The ranking is a leaders-only statistic — the root `_links` say whether this user may see it. */
	canSeeLeaders = computed(() => this.api.links()?.getTopLeaders?.allowed ?? false);

	skeletonRows = Array.from({ length: TOP_LEADERS_LIMIT });

	// Czech picks a different form for 1, for 2–4 and for everything else (0 included).
	childDaysPluralMap = { "=1": "dětoden", "=2": "dětodny", "=3": "dětodny", "=4": "dětodny", other: "dětodní" };
	childrenPluralMap = { "=1": "dítě", "=2": "děti", "=3": "děti", "=4": "děti", other: "dětí" };
	eventsPluralMap = { "=1": "akce", "=2": "akce", "=3": "akce", "=4": "akce", other: "akcí" };

	constructor(private api: ApiService) {
		// the permission only becomes known once the root request resolves, so load reactively
		effect(() => {
			if (this.canSeeLeaders()) this.loadTopLeaders();
		});
	}

	async loadTopLeaders() {
		const leaders = await this.api.StatisticsApi.getTopLeaders({ limit: TOP_LEADERS_LIMIT }).then((res) => res.data);
		this.leaders.set(this.setRanks(leaders));
	}

	/** Leaders with the same score share a place, the next one skips ahead (1., 1., 3., …). */
	private setRanks(leaders: SDK.TopLeaderResponse[]): RankedLeader[] {
		let rank = 0;
		let previousChildDays: number | undefined = undefined;

		return leaders.map((leader, index) => {
			if (leader.childDays !== previousChildDays) {
				rank = index + 1;
				previousChildDays = leader.childDays;
			}

			return { ...leader, rank };
		});
	}
}
