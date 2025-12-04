import { Component, OnInit, signal } from "@angular/core";
import { Platform, PopoverController } from "@ionic/angular";
import { UntilDestroy } from "@ngneat/until-destroy";
import { DateTime } from "luxon";
import { ApiService } from "src/app/services/api.service";
import { UserService } from "src/app/services/user.service";
import { SDK } from "src/sdk";

@UntilDestroy()
@Component({
	selector: "bo-home-dashboard",
	templateUrl: "./home-dashboard.component.html",
	styleUrls: ["./home-dashboard.component.scss"],
	standalone: false,
})
export class HomeDashboardComponent implements OnInit {
	isLg: boolean = false;

	view = signal("home");

	isPortrait = this.platform.isPortrait();

	dateFrom = DateTime.local();
	dateTill = DateTime.local().plus({ months: 1 });

	events: SDK.EventResponseWithLinks[] = [];

	user = this.userService.user;

	constructor(
		private api: ApiService,
		private platform: Platform,
		private userService: UserService,
		public popoverController: PopoverController,
	) {}

	ngOnInit(): void {
		this.loadCalendarEvents();
	}

	async loadCalendarEvents() {
		const options: any = {
			sort: "dateFrom",
		};

		this.dateTill = DateTime.local().plus({ months: 1 });

		options.filter = {
			dateTill: { $gte: this.dateFrom.toISODate() },
			dateFrom: { $lte: this.dateTill.toISODate() },
		};

		// TODO: use options above
		this.events = await this.api.EventsApi.listEvents().then((res) => res.data);
	}

	updateView() {
		this.isLg = this.platform.width() >= 992;
	}
}
