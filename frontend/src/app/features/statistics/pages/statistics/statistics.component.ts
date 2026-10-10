import { Component, signal } from "@angular/core";
import { addIcons } from "ionicons";
import { boatOutline, statsChartOutline } from "ionicons/icons";
import { PageContentComponent } from "src/app/shared/components/page-content/page-content.component";
import { PageFooterComponent } from "src/app/shared/components/page-footer/page-footer.component";
import { PageHeaderComponent } from "src/app/shared/components/page-header/page-header.component";
import { TabComponent } from "src/app/shared/components/tab/tab.component";
import { TabsComponent } from "src/app/shared/components/tabs/tabs.component";
import { VerticalMenuItemComponent } from "src/app/shared/components/vertical-menu-item/vertical-menu-item.component";
import { VerticalMenuComponent } from "src/app/shared/components/vertical-menu/vertical-menu.component";
import { StatisticsPaddlersComponent } from "../../components/statistics-paddlers/statistics-paddlers.component";
import { StatisticsOverviewComponent } from "../../components/statistics-overview/statistics-overview.component";

@Component({
	selector: "bo-statistics",
	templateUrl: "./statistics.component.html",
	imports: [
		PageHeaderComponent,
		PageContentComponent,
		PageFooterComponent,
		TabsComponent,
		TabComponent,
		VerticalMenuComponent,
		VerticalMenuItemComponent,
		StatisticsOverviewComponent,
		StatisticsPaddlersComponent,
	],
})
export class StatisticsComponent {
	view = signal<"prehled" | "vodak-roku">("prehled");

	constructor() {
		addIcons({ boatOutline, statsChartOutline });
	}
}
