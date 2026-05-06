import { Component, input, output, signal } from "@angular/core";
import { ActivatedRoute, Router } from "@angular/router";
import { IonList } from "@ionic/angular/standalone";
import { UntilDestroy, untilDestroyed } from "@ngneat/until-destroy";

export const VERTICAL_MENU_QUERY_PARAM = "tab";

@UntilDestroy()
@Component({
	selector: "bo-vertical-menu",
	templateUrl: "./vertical-menu.component.html",
	styleUrls: ["./vertical-menu.component.scss"],
	imports: [IonList],
})
export class VerticalMenuComponent {
	defaultTab = input<string>();
	change = output<string>();

	currentTab = signal<string | undefined>(undefined);

	constructor(
		private router: Router,
		private route: ActivatedRoute,
	) {
		this.route.queryParams.pipe(untilDestroyed(this)).subscribe((params) => {
			this.currentTab.set(params[VERTICAL_MENU_QUERY_PARAM] || this.defaultTab());
		});
	}

	ngOnInit(): void {
		if (this.currentTab()) {
			this.change.emit(this.currentTab()!);
		} else if (this.defaultTab()) {
			this.currentTab.set(this.defaultTab());
			this.change.emit(this.defaultTab()!);
		}
	}

	onItemClick(tab: string): void {
		this.currentTab.set(tab);
		this.change.emit(tab);

		this.router.navigate([], {
			relativeTo: this.route,
			queryParams: { [VERTICAL_MENU_QUERY_PARAM]: tab },
			queryParamsHandling: "merge",
		});
	}
}
