import { I18nPluralPipe } from "@angular/common";
import { Component, computed, effect, signal } from "@angular/core";
import { IonContent, IonIcon, IonItem, IonLabel, IonList, IonPopover, IonSkeletonText } from "@ionic/angular/standalone";
import { addIcons } from "ionicons";
import { chevronBackOutline, chevronForwardOutline, informationCircleOutline } from "ionicons/icons";
import { ApiService } from "src/app/core/services/api.service";
import { CardContentComponent } from "src/app/shared/components/card-content/card-content.component";
import { CardHeaderComponent } from "src/app/shared/components/card-header/card-header.component";
import { CardTitleComponent } from "src/app/shared/components/card-title/card-title.component";
import { CardComponent } from "src/app/shared/components/card/card.component";
import { DateRangePipe } from "src/app/shared/pipes/date-range.pipe";
import { SDK } from "src/sdk";

/** How many leaders the ranking shows. */
const TOP_LEADERS_LIMIT = 5;

export type RankedLeader = SDK.TopLeaderResponse & { rank: number };

export type LeadersStatistics = Omit<SDK.TopLeadersResponse, "leaders"> & { leaders: RankedLeader[] };

@Component({
	selector: "bo-home-card-top-leaders",
	templateUrl: "./home-card-top-leaders.component.html",
	styleUrls: ["./home-card-top-leaders.component.scss"],

	imports: [
		DateRangePipe,
		I18nPluralPipe,
		IonContent,
		IonIcon,
		IonList,
		IonItem,
		IonLabel,
		IonPopover,
		IonSkeletonText,
		CardComponent,
		CardHeaderComponent,
		CardTitleComponent,
		CardContentComponent,
	],
})
export class HomeCardTopLeadersComponent {
	/** `undefined` until the first response arrives, so the card can show its skeleton rows. */
	statistics = signal<LeadersStatistics | undefined>(undefined);

	year = signal(new Date().getFullYear());

	/** The ranking is a leaders-only statistic — the root `_links` say whether this user may see it. */
	canSeeLeaders = computed(() => this.api.links()?.getTopLeaders?.allowed ?? false);

	// the arrows stop at the years that actually have events, so there is nothing to page into
	canGoBack = computed(() => this.year() > (this.statistics()?.firstYear ?? this.year()));
	canGoForward = computed(() => this.year() < (this.statistics()?.lastYear ?? this.year()));

	infoOpen = signal(false);
	infoEvent = signal<Event | undefined>(undefined);

	/** The row whose events are shown, with the year they were loaded for. */
	openedLeader = signal<{ leader: RankedLeader; year: number } | undefined>(undefined);
	leaderEventsOpen = signal(false);
	leaderEventsEvent = signal<Event | undefined>(undefined);
	/** `undefined` while the events of the opened leader are still loading. */
	leaderEvents = signal<SDK.LeaderEventResponse[] | undefined>(undefined);

	skeletonRows = Array.from({ length: TOP_LEADERS_LIMIT });

	// Czech picks a different form for 1, for 2–4 and for everything else (0 included).
	childDaysPluralMap = { "=1": "děťoden", "=2": "děťodny", "=3": "děťodny", "=4": "děťodny", other: "děťodní" };
	eventsPluralMap = { "=1": "akce", "=2": "akce", "=3": "akce", "=4": "akce", other: "akcí" };

	constructor(private api: ApiService) {
		addIcons({ chevronBackOutline, chevronForwardOutline, informationCircleOutline });

		// the permission only becomes known once the root request resolves, and the year changes
		// with the arrows — so load reactively from both
		effect(() => {
			const year = this.year();
			if (this.canSeeLeaders()) this.loadStatistics(year);
		});
	}

	previousYear() {
		this.year.update((year) => year - 1);
		this.leaderEventsOpen.set(false);
	}

	nextYear() {
		this.year.update((year) => year + 1);
		this.leaderEventsOpen.set(false);
	}

	openInfo(event: Event) {
		this.infoEvent.set(event);
		this.infoOpen.set(true);
	}

	/** Opens the breakdown of the events that make up this leader's score. */
	async openLeaderEvents(event: Event, leader: RankedLeader) {
		const year = this.year();

		this.openedLeader.set({ leader, year });
		this.leaderEvents.set(undefined);
		this.leaderEventsEvent.set(event);
		this.leaderEventsOpen.set(true);

		const events = await this.api.StatisticsApi.getLeaderEvents(leader.memberId, { year }).then((res) => res.data);

		// a slow response must not land in a popover that meanwhile shows somebody else
		const opened = this.openedLeader();
		if (opened?.leader.memberId !== leader.memberId || opened.year !== year) return;

		this.leaderEvents.set(events);
	}

	async loadStatistics(year: number) {
		const statistics = await this.api.StatisticsApi.getTopLeaders({ year, limit: TOP_LEADERS_LIMIT }).then(
			(res) => res.data,
		);

		// a slow response must not overwrite a year the user has already clicked past
		if (this.year() !== year) return;

		this.statistics.set({ ...statistics, leaders: this.setRanks(statistics.leaders) });
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
