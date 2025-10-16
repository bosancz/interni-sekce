import { Component, OnInit } from "@angular/core";
import { Platform } from "@ionic/angular";
import { UntilDestroy, untilDestroyed } from "@ngneat/until-destroy";

@UntilDestroy()
@Component({
	selector: "bo-home-dashboard",
	templateUrl: "./home-dashboard.component.html",
	styleUrls: ["./home-dashboard.component.scss"],
	standalone: false,
})
export class HomeDashboardComponent implements OnInit {
	isLg: boolean = false;

	constructor(
		private api: ApiService,
		private platform: Platform,
	) {}

	ngOnInit(): void {
		this.platform.resize.pipe(untilDestroyed(this)).subscribe(() => this.updateView());

		this.updateView();
	}

	updateView() {
		this.isLg = this.platform.width() >= 992;
	}
}
