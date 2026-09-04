import { I18nPluralPipe } from "@angular/common";
import { Component, computed, effect, signal } from "@angular/core";
import { IonContent, IonItem, IonLabel, IonList, IonPopover, IonSkeletonText } from "@ionic/angular/standalone";
import { ApiService } from "src/app/core/services/api.service";
import { DateRangePipe } from "src/app/shared/pipes/date-range.pipe";
import { SDK } from "src/sdk";
import { HomeLeaderboardCardComponent } from "../home-leaderboard-card/home-leaderboard-card.component";

const TOP_CHILDREN_LIMIT = 5;

@Component({
	selector: "bo-home-card-top-children",
	templateUrl: "./home-card-top-children.component.html",
	styleUrls: ["./home-card-top-children.component.scss"],

	imports: [
		DateRangePipe,
		I18nPluralPipe,
		IonContent,
		IonList,
		IonItem,
		IonLabel,
		IonPopover,
		IonSkeletonText,
		HomeLeaderboardCardComponent,
	],
})
export class HomeCardTopChildrenComponent {
	statistics = signal<SDK.TopChildrenResponse | undefined>(undefined);

	year = signal(new Date().getFullYear());

	canSeeChildren = computed(() => this.api.links()?.getTopChildren?.allowed ?? false);

	canGoBack = computed(() => this.year() > (this.statistics()?.firstYear ?? this.year()));
	canGoForward = computed(() => this.year() < (this.statistics()?.lastYear ?? this.year()));

	openedChild = signal<{ child: SDK.TopChildResponse; year: number } | undefined>(undefined);
	childEventsOpen = signal(false);
	childEventsEvent = signal<Event | undefined>(undefined);
	childEvents = signal<SDK.ChildEventResponse[] | undefined>(undefined);

	skeletonRows = Array.from({ length: TOP_CHILDREN_LIMIT });

	infoLines = [
		"Počítá se každý den akce, na které dítě bylo.",
		"Dítě je člen mladší 15 let v době konání akce. Počítají se jen skončené a nezrušené akce.",
	];

	childDaysPluralMap = { "=1": "děťoden", "=2": "děťodny", "=3": "děťodny", "=4": "děťodny", other: "děťodní" };
	daysPluralMap = { "=1": "den", "=2": "dny", "=3": "dny", "=4": "dny", other: "dní" };
	eventsPluralMap = { "=1": "akce", "=2": "akce", "=3": "akce", "=4": "akce", other: "akcí" };

	constructor(private api: ApiService) {
		effect(() => {
			const year = this.year();
			if (this.canSeeChildren()) this.loadStatistics(year);
		});
	}

	previousYear() {
		this.year.update((year) => year - 1);
		this.childEventsOpen.set(false);
	}

	nextYear() {
		this.year.update((year) => year + 1);
		this.childEventsOpen.set(false);
	}

	async openChildEvents(event: Event, child: SDK.TopChildResponse) {
		const year = this.year();

		this.openedChild.set({ child, year });
		this.childEvents.set(undefined);
		this.childEventsEvent.set(event);
		this.childEventsOpen.set(true);

		const events = await this.api.StatisticsApi.getChildEvents(child.memberId, { year }).then((res) => res.data);

		const opened = this.openedChild();
		if (opened?.child.memberId !== child.memberId || opened.year !== year) return;

		this.childEvents.set(events);
	}

	async loadStatistics(year: number) {
		const statistics = await this.api.StatisticsApi.getTopChildren({ year, limit: TOP_CHILDREN_LIMIT }).then(
			(res) => res.data,
		);

		if (this.year() !== year) return;

		this.statistics.set(statistics);
	}
}
