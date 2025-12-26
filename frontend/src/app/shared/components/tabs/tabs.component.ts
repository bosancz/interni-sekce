import { Component, EventEmitter, Input, OnInit, Output } from "@angular/core";
import { ActivatedRoute, Router } from "@angular/router";

export const TABS_QUERY_PARAM = "tab";

@Component({
	selector: "bo-tabs",
	templateUrl: "./tabs.component.html",
	styleUrl: "./tabs.component.scss",
	standalone: false,
})
export class TabsComponent implements OnInit {
	@Input() defaultTab?: string;

	@Output() change = new EventEmitter<string>();

	constructor(
		private router: Router,
		private route: ActivatedRoute,
	) {}

	ngOnInit(): void {
		this.route.queryParams.subscribe((params) => {
			const name = params[TABS_QUERY_PARAM];

			if (name) this.change.emit(name);
			else if (this.defaultTab) this.openTab(this.defaultTab);
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
