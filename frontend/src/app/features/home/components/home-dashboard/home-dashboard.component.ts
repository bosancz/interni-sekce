import { Component, OnInit, signal } from "@angular/core";
import { PopoverController } from "@ionic/angular";
import { UntilDestroy } from "@ngneat/until-destroy";
import { DateTime } from "luxon";
import { ApiService } from "src/app/services/api.service";
import { UserService } from "src/app/services/user.service";
import { EventCalendarComponent } from "src/app/shared/components/event-calendar/event-calendar.component";
import { HomeCardMyEventsComponent } from "../home-card-my-events/home-card-my-events.component";
import { HomeCardNoleaderEventsComponent } from "../home-card-noleader-events/home-card-noleader-events.component";
import { HomeCardSearchMemberComponent } from "../home-card-search-member/home-card-search-member.component";
import { SDK } from "src/sdk";

@UntilDestroy()
@Component({
	selector: "bo-home-dashboard",
	templateUrl: "./home-dashboard.component.html",
	styleUrls: ["./home-dashboard.component.scss"],
	standalone: true,
	imports: [
		EventCalendarComponent,
		HomeCardMyEventsComponent,
		HomeCardNoleaderEventsComponent,
		HomeCardSearchMemberComponent,
	],
})
export class HomeDashboardComponent implements OnInit {
	view = signal("home");

	dateFrom = DateTime.local();
	dateTill = DateTime.local().plus({ months: 1 });

	events = signal<SDK.EventResponseWithLinks[]>([]);

	user = this.userService.user;

	constructor(
		private api: ApiService,
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
		const events = await this.api.EventsApi.listEvents().then((res) => res.data);
		this.events.set(events);
	}
}
