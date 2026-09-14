import { I18nPluralPipe } from "@angular/common";
import { Component, computed, effect, signal } from "@angular/core";
import { RouterLink } from "@angular/router";
import { IonItem, IonLabel, IonList, IonSkeletonText } from "@ionic/angular/standalone";
import { ApiService } from "src/app/core/services/api.service";
import { DateRangePipe } from "src/app/shared/pipes/date-range.pipe";
import { SDK } from "src/sdk";
import { HomeLeaderboardCardComponent } from "../home-leaderboard-card/home-leaderboard-card.component";

const TOP_EVENTS_LIMIT = 5;

@Component({
	selector: "bo-home-card-top-events",
	templateUrl: "./home-card-top-events.component.html",
	styleUrls: ["./home-card-top-events.component.scss"],

	imports: [
		DateRangePipe,
		I18nPluralPipe,
		IonList,
		IonItem,
		IonLabel,
		IonSkeletonText,
		RouterLink,
		HomeLeaderboardCardComponent,
	],
})
export class HomeCardTopEventsComponent {
	statistics = signal<SDK.TopEventsResponse | undefined>(undefined);

	year = signal(new Date().getFullYear());

	canSeeEvents = computed(() => this.api.links()?.getTopEvents?.allowed ?? false);

	canGoBack = computed(() => this.year() > (this.statistics()?.firstYear ?? this.year()));
	canGoForward = computed(() => this.year() < (this.statistics()?.lastYear ?? this.year()));

	skeletonRows = Array.from({ length: TOP_EVENTS_LIMIT });

	infoLines = [
		"Děťoden = jedno dítě na jednom dni akce.",
		"Dvoudenní akce se třemi dětmi má 6 děťodní. Počítají se jen skončené a nezrušené akce.",
	];

	childDaysPluralMap = { "=1": "děťoden", "=2": "děťodny", "=3": "děťodny", "=4": "děťodny", other: "děťodní" };
	childrenPluralMap = { "=1": "dítě", "=2": "děti", "=3": "děti", "=4": "děti", other: "dětí" };
	daysPluralMap = { "=1": "den", "=2": "dny", "=3": "dny", "=4": "dny", other: "dní" };

	constructor(private api: ApiService) {
		effect(() => {
			const year = this.year();
			if (this.canSeeEvents()) this.loadStatistics(year);
		});
	}

	previousYear() {
		this.year.update((year) => year - 1);
	}

	nextYear() {
		this.year.update((year) => year + 1);
	}

	async loadStatistics(year: number) {
		const statistics = await this.api.StatisticsApi.getTopEvents({ year, limit: TOP_EVENTS_LIMIT }).then(
			(res) => res.data,
		);

		if (this.year() !== year) return;

		this.statistics.set(statistics);
	}
}
