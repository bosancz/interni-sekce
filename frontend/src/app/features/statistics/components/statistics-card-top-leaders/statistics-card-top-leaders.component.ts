import { I18nPluralPipe } from "@angular/common";
import { Component, computed, effect, input, signal } from "@angular/core";
import { IonContent, IonItem, IonLabel, IonList, IonPopover, IonSkeletonText } from "@ionic/angular/standalone";
import { ApiService } from "src/app/core/services/api.service";
import { DateRangePipe } from "src/app/shared/pipes/date-range.pipe";
import { SDK } from "src/sdk";
import { StatisticsLeaderboardCardComponent } from "../statistics-leaderboard-card/statistics-leaderboard-card.component";

const TOP_LEADERS_LIMIT = 5;

export type RankedLeader = SDK.TopLeaderResponse | SDK.MyRankingResponse;

@Component({
	selector: "bo-statistics-card-top-leaders",
	templateUrl: "./statistics-card-top-leaders.component.html",
	styleUrls: ["./statistics-card-top-leaders.component.scss"],

	imports: [
		DateRangePipe,
		I18nPluralPipe,
		IonContent,
		IonList,
		IonItem,
		IonLabel,
		IonPopover,
		IonSkeletonText,
		StatisticsLeaderboardCardComponent,
	],
})
export class StatisticsCardTopLeadersComponent {
	statistics = signal<SDK.TopLeadersResponse | undefined>(undefined);

	year = input.required<number>();

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

	openedLeader = signal<{ leader: RankedLeader; year: number } | undefined>(undefined);
	leaderEventsOpen = signal(false);
	leaderEventsEvent = signal<Event | undefined>(undefined);
	leaderEvents = signal<SDK.LeaderEventResponse[] | undefined>(undefined);

	skeletonRows = Array.from({ length: TOP_LEADERS_LIMIT });

	infoLines = [
		"Děťoden = jedno dítě na jednom dni akce.",
		"Dvoudenní akce se třemi dětmi má 6 děťodní. Celé skóre akce dostane každý její vedoucí.",
	];

	childDaysPluralMap = { "=1": "děťoden", "=2": "děťodny", "=3": "děťodny", "=4": "děťodny", other: "děťodní" };
	eventsPluralMap = { "=1": "akce", "=2": "akce", "=3": "akce", "=4": "akce", other: "akcí" };

	constructor(private api: ApiService) {
		effect(() => {
			const year = this.year();
			this.leaderEventsOpen.set(false);
			if (this.canSeeLeaders()) this.loadStatistics(year);
		});
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
