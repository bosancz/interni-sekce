import { DecimalPipe, I18nPluralPipe } from "@angular/common";
import { Component, computed, effect, model, signal } from "@angular/core";
import { IonSkeletonText } from "@ionic/angular/standalone";
import { ApiService } from "src/app/core/services/api.service";
import { SDK } from "src/sdk";
import { StatisticsLeaderboardCardComponent } from "../statistics-leaderboard-card/statistics-leaderboard-card.component";

@Component({
	selector: "bo-statistics-card-paddlers-summary",
	templateUrl: "./statistics-card-paddlers-summary.component.html",
	styleUrls: ["./statistics-card-paddlers-summary.component.scss"],

	imports: [DecimalPipe, I18nPluralPipe, IonSkeletonText, StatisticsLeaderboardCardComponent],
})
export class StatisticsCardPaddlersSummaryComponent {
	statistics = signal<SDK.PaddlersSummaryResponse | undefined>(undefined);

	year = model.required<number>();

	canSeeStatistics = computed(() => this.api.links()?.getPaddlersSummary?.allowed ?? false);

	canGoBack = computed(() => this.year() > (this.statistics()?.firstYear ?? this.year()));
	canGoForward = computed(() => this.year() < (this.statistics()?.lastYear ?? this.year()));

	skeletonTiles = Array.from({ length: 3 });

	infoLines = [
		"Akce na vodě je každá akce s vyplněnými kilometry na vodě v reportu.",
		"Řeky se počítají podle názvu v reportu, každá jednou.",
		"Počítají se jen skončené a nezrušené akce.",
	];

	riversPluralMap = { "=1": "řeka", "=2": "řeky", "=3": "řeky", "=4": "řeky", other: "řek" };
	eventsPluralMap = {
		"=1": "akce na vodě",
		"=2": "akce na vodě",
		"=3": "akce na vodě",
		"=4": "akce na vodě",
		other: "akcí na vodě",
	};

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
		const statistics = await this.api.StatisticsApi.getPaddlersSummary({ year }).then((res) => res.data);

		if (this.year() !== year) return;

		this.statistics.set(statistics);
	}
}
