import { Component } from "@angular/core";
import { PageContentComponent } from "src/app/shared/components/page-content/page-content.component";
import { PageHeaderComponent } from "src/app/shared/components/page-header/page-header.component";
import { StatisticsOverviewComponent } from "../../components/statistics-overview/statistics-overview.component";

@Component({
	selector: "bo-statistics",
	templateUrl: "./statistics.component.html",
	imports: [PageHeaderComponent, PageContentComponent, StatisticsOverviewComponent],
})
export class StatisticsComponent {}
