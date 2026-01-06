import { Component, input, OnInit, output } from "@angular/core";
import { ActivatedRoute, Router } from "@angular/router";
import { IonTabBar } from "@ionic/angular/standalone";

export const TABS_QUERY_PARAM = "tab";

@Component({
	selector: "bo-tabs",
	templateUrl: "./tabs.component.html",
	styleUrl: "./tabs.component.scss",
	
	imports: [IonTabBar],
})
export class TabsComponent implements OnInit {
	defaultTab = input<string | undefined>();

	change = output<string>();

	constructor(
		private router: Router,
		private route: ActivatedRoute,
	) {}

	ngOnInit(): void {
		this.route.queryParams.subscribe((params) => {
			const name = params[TABS_QUERY_PARAM];

			if (name) this.change.emit(name);
			else {
				const defaultTab = this.defaultTab();
				if (defaultTab) this.openTab(defaultTab);
			}
		});
	}

	private openTab(name: string) {
		this.router.navigate([], {
			relativeTo: this.route,
			queryParams: { tab: name },
			replaceUrl: true,
		});
	}
}
