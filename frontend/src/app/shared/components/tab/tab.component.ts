import { Component, input, OnInit, signal } from "@angular/core";
import { ActivatedRoute, Router } from "@angular/router";
import { IonBadge, IonIcon, IonLabel, IonTabButton } from "@ionic/angular/standalone";
import { TABS_QUERY_PARAM } from "../tabs/tabs.component";

@Component({
	selector: "bo-tab",
	templateUrl: "./tab.component.html",
	styleUrl: "./tab.component.scss",

	imports: [IonTabButton, IonIcon, IonLabel, IonBadge],
})
export class TabComponent implements OnInit {
	label = input<string | undefined>();
	name = input<string | undefined>();
	icon = input<string | undefined>();
	color = input<string | undefined>();
	disabled = input<boolean | undefined>();

	badge = input<string | number | undefined>();
	badgeColor = input<string | undefined>();

	active = signal(false);

	constructor(
		private readonly route: ActivatedRoute,
		private readonly router: Router,
	) {}

	ngOnInit(): void {
		this.route.queryParams.subscribe((params) => {
			this.active.set(params[TABS_QUERY_PARAM] === this.name());
		});
	}

	openTab() {
		const queryParams = this.route.snapshot.queryParams;
		this.router.navigate([], {
			relativeTo: this.route,
			queryParams: { ...queryParams, [TABS_QUERY_PARAM]: this.name() },
			replaceUrl: true,
		});
	}
}
