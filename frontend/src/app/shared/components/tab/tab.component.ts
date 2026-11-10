import { Component, computed, input, OnInit, output, signal } from "@angular/core";
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
	badgeVariant = input<"neutral" | "attention">("neutral");

	selected = input<boolean | undefined>();

	select = output<void>();

	private queryActive = signal(false);

	active = computed(() => this.selected() ?? this.queryActive());

	constructor(
		private readonly route: ActivatedRoute,
		private readonly router: Router,
	) {}

	ngOnInit(): void {
		this.route.queryParams.subscribe((params) => {
			this.queryActive.set(params[TABS_QUERY_PARAM] === this.name());
		});
	}

	openTab() {
		if (this.selected() !== undefined) {
			this.select.emit();
			return;
		}

		const queryParams = this.route.snapshot.queryParams;
		this.router.navigate([], {
			relativeTo: this.route,
			queryParams: { ...queryParams, [TABS_QUERY_PARAM]: this.name() },
			replaceUrl: true,
		});
	}
}
