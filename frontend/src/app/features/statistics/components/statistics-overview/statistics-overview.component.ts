import { Component, signal } from "@angular/core";
import { StatisticsCardSummaryComponent } from "../statistics-card-summary/statistics-card-summary.component";
import { StatisticsCardTopChildrenComponent } from "../statistics-card-top-children/statistics-card-top-children.component";
import { StatisticsCardTopEventsComponent } from "../statistics-card-top-events/statistics-card-top-events.component";
import { StatisticsCardTopLeadersComponent } from "../statistics-card-top-leaders/statistics-card-top-leaders.component";

@Component({
	selector: "bo-statistics-overview",
	templateUrl: "./statistics-overview.component.html",
	imports: [
		StatisticsCardSummaryComponent,
		StatisticsCardTopLeadersComponent,
		StatisticsCardTopEventsComponent,
		StatisticsCardTopChildrenComponent,
	],
})
export class StatisticsOverviewComponent {
	year = signal(new Date().getFullYear());
}
