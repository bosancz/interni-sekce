import { Component, signal } from "@angular/core";
import { StatisticsCardPaddlersRankingComponent } from "../statistics-card-paddlers-ranking/statistics-card-paddlers-ranking.component";
import { StatisticsCardPaddlersSummaryComponent } from "../statistics-card-paddlers-summary/statistics-card-paddlers-summary.component";

@Component({
	selector: "bo-statistics-paddlers",
	templateUrl: "./statistics-paddlers.component.html",
	imports: [StatisticsCardPaddlersSummaryComponent, StatisticsCardPaddlersRankingComponent],
})
export class StatisticsPaddlersComponent {
	year = signal(new Date().getFullYear());
}
