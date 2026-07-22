import { Component, OnInit, signal } from "@angular/core";
import { RouterLink } from "@angular/router";
import { PopoverController } from "@ionic/angular/standalone";
import { UntilDestroy } from "@ngneat/until-destroy";
import { DateTime } from "luxon";
import { ApiService } from "src/app/core/services/api.service";
import { UserService } from "src/app/core/services/user.service";
import { ButtonSquareComponent } from "src/app/shared/components/button-square/button-square.component";
import { EventCalendarComponent } from "src/app/shared/components/event-calendar/event-calendar.component";
import { PageContentComponent } from "src/app/shared/components/page-content/page-content.component";
import { SDK } from "src/sdk";
import { HomeCardMyEventsComponent } from "../home-card-my-events/home-card-my-events.component";
import { HomeCardNoleaderEventsComponent } from "../home-card-noleader-events/home-card-noleader-events.component";

@UntilDestroy()
@Component({
	selector: "bo-home-dashboard",
	templateUrl: "./home-dashboard.component.html",
	styleUrls: ["./home-dashboard.component.scss"],
	imports: [
		EventCalendarComponent,
		HomeCardMyEventsComponent,
		HomeCardNoleaderEventsComponent,
		PageContentComponent,
		ButtonSquareComponent,
		RouterLink,
	],
})
export class HomeDashboardComponent implements OnInit {
	view = signal("home");

	dateFrom = signal(DateTime.local());
	dateTill = signal(DateTime.local().plus({ months: 1 }));

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

		this.dateTill.set(DateTime.local().plus({ months: 1 }));

		options.filter = {
			dateTill: { $gte: this.dateFrom().toISODate() },
			dateFrom: { $lte: this.dateTill().toISODate() },
		};

		// TODO: use options above
		const events = await this.api.EventsApi.listEvents().then((res: any) => res.data);
		this.events.set(events);
	}
}
