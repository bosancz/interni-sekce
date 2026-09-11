import { I18nPluralPipe } from "@angular/common";
import { Component, computed, effect, signal } from "@angular/core";
import { IonSkeletonText } from "@ionic/angular/standalone";
import { ApiService } from "src/app/core/services/api.service";
import { SDK } from "src/sdk";
import { HomeLeaderboardCardComponent } from "../home-leaderboard-card/home-leaderboard-card.component";

@Component({
	selector: "bo-home-card-statistics",
	templateUrl: "./home-card-statistics.component.html",
	styleUrls: ["./home-card-statistics.component.scss"],

	imports: [I18nPluralPipe, IonSkeletonText, HomeLeaderboardCardComponent],
})
export class HomeCardStatisticsComponent {
	statistics = signal<SDK.SummaryResponse | undefined>(undefined);

	year = signal(new Date().getFullYear());

	canSeeStatistics = computed(() => this.api.links()?.getSummary?.allowed ?? false);

	canGoBack = computed(() => this.year() > (this.statistics()?.firstYear ?? this.year()));
	canGoForward = computed(() => this.year() < (this.statistics()?.lastYear ?? this.year()));

	skeletonTiles = Array.from({ length: 3 });

	infoLines = [
		"Aktivní dítě bylo aspoň na jedné akci, aktivní vedoucí aspoň jednu akci vedl.",
		"Děťoden = jedno dítě na jednom dni akce. Dvoudenní akce se třemi dětmi má 6 děťodní.",
		"Počítají se jen skončené a nezrušené akce.",
	];

	childrenPluralMap = {
		"=1": "aktivní dítě",
		"=2": "aktivní děti",
		"=3": "aktivní děti",
		"=4": "aktivní děti",
		other: "aktivních dětí",
	};
	leadersPluralMap = {
		"=1": "aktivní vedoucí",
		"=2": "aktivní vedoucí",
		"=3": "aktivní vedoucí",
		"=4": "aktivní vedoucí",
		other: "aktivních vedoucích",
	};
	childDaysPluralMap = { "=1": "děťoden", "=2": "děťodny", "=3": "děťodny", "=4": "děťodny", other: "děťodní" };

	constructor(private api: ApiService) {
		effect(() => {
			const year = this.year();
			if (this.canSeeStatistics()) this.loadStatistics(year);
		});
	}

	previousYear() {
		this.year.update((year) => year - 1);
	}

	nextYear() {
		this.year.update((year) => year + 1);
	}

	async loadStatistics(year: number) {
		const statistics = await this.api.StatisticsApi.getSummary({ year }).then((res) => res.data);

		if (this.year() !== year) return;

		this.statistics.set(statistics);
	}
}
