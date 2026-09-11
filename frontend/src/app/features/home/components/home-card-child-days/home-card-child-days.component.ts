import { I18nPluralPipe } from "@angular/common";
import { Component, computed, effect, signal } from "@angular/core";
import { IonSkeletonText } from "@ionic/angular/standalone";
import { ApiService } from "src/app/core/services/api.service";
import { SDK } from "src/sdk";
import { HomeLeaderboardCardComponent } from "../home-leaderboard-card/home-leaderboard-card.component";

@Component({
	selector: "bo-home-card-child-days",
	templateUrl: "./home-card-child-days.component.html",
	styleUrls: ["./home-card-child-days.component.scss"],

	imports: [I18nPluralPipe, IonSkeletonText, HomeLeaderboardCardComponent],
})
export class HomeCardChildDaysComponent {
	statistics = signal<SDK.ChildDaysResponse | undefined>(undefined);

	year = signal(new Date().getFullYear());

	canSeeChildDays = computed(() => this.api.links()?.getChildDays?.allowed ?? false);

	canGoBack = computed(() => this.year() > (this.statistics()?.firstYear ?? this.year()));
	canGoForward = computed(() => this.year() < (this.statistics()?.lastYear ?? this.year()));

	infoLines = [
		"Děťoden = jedno dítě na jednom dni akce.",
		"Dvoudenní akce se třemi dětmi má 6 děťodní. Počítají se jen skončené a nezrušené akce.",
	];

	childDaysPluralMap = { "=1": "děťoden", "=2": "děťodny", "=3": "děťodny", "=4": "děťodny", other: "děťodní" };

	constructor(private api: ApiService) {
		effect(() => {
			const year = this.year();
			if (this.canSeeChildDays()) this.loadStatistics(year);
		});
	}

	previousYear() {
		this.year.update((year) => year - 1);
	}

	nextYear() {
		this.year.update((year) => year + 1);
	}

	async loadStatistics(year: number) {
		const statistics = await this.api.StatisticsApi.getChildDays({ year }).then((res) => res.data);

		if (this.year() !== year) return;

		this.statistics.set(statistics);
	}
}
