import { Component, OnInit, signal } from "@angular/core";
import { DateTime } from "luxon";
import { ApiService } from "src/app/core/services/api.service";
import { EventCalendarComponent } from "src/app/shared/components/event-calendar/event-calendar.component";
import { SDK } from "src/sdk";

@Component({
	selector: "bo-home-calendar",
	templateUrl: "./home-calendar.component.html",
	styleUrls: ["./home-calendar.component.scss"],
	
	imports: [EventCalendarComponent],
})
export class HomeCalendarComponent implements OnInit {
	dateFrom = DateTime.local().minus({ weeks: 2 });
	dateTill = DateTime.local().plus({ years: 1 });

	events = signal<SDK.EventResponseWithLinks[]>([]);

	constructor(private api: ApiService) {}

	ngOnInit(): void {
		this.loadCalendarEvents();
	}

	async loadCalendarEvents() {
		const options: any = {
			sort: "dateFrom",
		};

		options.filter = {
			dateTill: { $gte: this.dateFrom.toISODate() },
			dateFrom: { $lte: this.dateTill.toISODate() },
		};

		// TODO: use options above
		const events = await this.api.EventsApi.listEvents().then((res) => res.data);
		this.events.set(events);
	}
}
