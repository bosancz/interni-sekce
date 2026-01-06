import { Component, Input, OnInit } from "@angular/core";
import { ActivatedRoute, Router } from "@angular/router";
import { IonBadge, IonIcon, IonLabel, IonTabButton } from "@ionic/angular/standalone";
import { TABS_QUERY_PARAM } from "../tabs/tabs.component";

@Component({
	selector: "bo-tab",
	templateUrl: "./tab.component.html",
	styleUrl: "./tab.component.scss",
	standalone: true,
	imports: [IonTabButton, IonIcon, IonLabel, IonBadge],
})
export class TabComponent implements OnInit {
	@Input() label?: string;
	@Input() name?: string;
	@Input() icon?: string;
	@Input() color?: string;
	@Input() disabled?: boolean;

	@Input() badge?: string | number;
	@Input() badgeColor?: string;

	active = false;

	constructor(
		private readonly route: ActivatedRoute,
		private readonly router: Router,
	) {}

	ngOnInit(): void {
		this.route.queryParams.subscribe((params) => {
			this.active = params[TABS_QUERY_PARAM] === this.name;
		});
	}

	openTab() {
		const queryParams = this.route.snapshot.queryParams;
		this.router.navigate([], {
			relativeTo: this.route,
			queryParams: { ...queryParams, [TABS_QUERY_PARAM]: this.name },
			replaceUrl: true,
		});
	}
}
