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

const TOP_LEADERS_LIMIT = 5;

export type RankedLeader = SDK.TopLeaderResponse | SDK.MyRankingResponse;

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
	statistics = signal<SDK.TopLeadersResponse | undefined>(undefined);

	year = signal(new Date().getFullYear());

	myRanking = computed(() => {
		const statistics = this.statistics();
		if (!statistics?.me) return undefined;

		const inTop = statistics.leaders.some((leader) => leader.memberId === statistics.me!.memberId);

		return inTop ? undefined : statistics.me;
	});

	myRankingHasGap = computed(() => {
		const rank = this.myRanking()?.rank;
		const lastShown = this.statistics()?.leaders.at(-1)?.rank;

		return rank == null || lastShown === undefined || rank > lastShown + 1;
	});

	canSeeLeaders = computed(() => this.api.links()?.getTopLeaders?.allowed ?? false);

	canGoBack = computed(() => this.year() > (this.statistics()?.firstYear ?? this.year()));
	canGoForward = computed(() => this.year() < (this.statistics()?.lastYear ?? this.year()));

	infoOpen = signal(false);
	infoEvent = signal<Event | undefined>(undefined);

	openedLeader = signal<{ leader: RankedLeader; year: number } | undefined>(undefined);
	leaderEventsOpen = signal(false);
	leaderEventsEvent = signal<Event | undefined>(undefined);
	leaderEvents = signal<SDK.LeaderEventResponse[] | undefined>(undefined);

	skeletonRows = Array.from({ length: TOP_LEADERS_LIMIT });

	childDaysPluralMap = { "=1": "děťoden", "=2": "děťodny", "=3": "děťodny", "=4": "děťodny", other: "děťodní" };
	eventsPluralMap = { "=1": "akce", "=2": "akce", "=3": "akce", "=4": "akce", other: "akcí" };

	constructor(private api: ApiService) {
		addIcons({ chevronBackOutline, chevronForwardOutline, informationCircleOutline });

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

	async openLeaderEvents(event: Event, leader: RankedLeader) {
		const year = this.year();

		this.openedLeader.set({ leader, year });
		this.leaderEvents.set(undefined);
		this.leaderEventsEvent.set(event);
		this.leaderEventsOpen.set(true);

		const events = await this.api.StatisticsApi.getLeaderEvents(leader.memberId, { year }).then((res) => res.data);

		const opened = this.openedLeader();
		if (opened?.leader.memberId !== leader.memberId || opened.year !== year) return;

		this.leaderEvents.set(events);
	}

	async loadStatistics(year: number) {
		const statistics = await this.api.StatisticsApi.getTopLeaders({ year, limit: TOP_LEADERS_LIMIT }).then(
			(res) => res.data,
		);

		if (this.year() !== year) return;

		this.statistics.set(statistics);
	}
}
