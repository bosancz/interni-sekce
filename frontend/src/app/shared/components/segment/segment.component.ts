import { Component, input, OnInit, output, signal } from "@angular/core";
import { ActivatedRoute, Router } from "@angular/router";
import { IonSegment, SegmentCustomEvent } from "@ionic/angular/standalone";
import { TABS_QUERY_PARAM } from "../tabs/tabs.component";

@Component({
	selector: "bo-segment",
	templateUrl: "./segment.component.html",
	styleUrls: ["./segment.component.scss"],
	imports: [IonSegment],
})
export class SegmentComponent implements OnInit {
	defaultTab = input<string | undefined>();

	change = output<string>();

	currentTab = signal<string | undefined>(undefined);

	constructor(
		private router: Router,
		private route: ActivatedRoute,
	) {}

	ngOnInit(): void {
		this.route.queryParams.subscribe((params) => {
			const name = params[TABS_QUERY_PARAM];

			if (name) {
				this.currentTab.set(name);
				this.change.emit(name);
			} else {
				const defaultTab = this.defaultTab();
				if (defaultTab) this.openTab(defaultTab);
			}
		});
	}

	onSegmentChange(event: SegmentCustomEvent) {
		const value = event.detail.value;
		if (value) this.openTab(String(value));
	}

	private openTab(name: string) {
		this.router.navigate([], {
			relativeTo: this.route,
			queryParams: { [TABS_QUERY_PARAM]: name },
			replaceUrl: true,
		});
	}
}
