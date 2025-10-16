import { Component, OnInit } from "@angular/core";

@Component({
	selector: "bo-home-card-my-events",
	templateUrl: "./home-card-my-events.component.html",
	styleUrls: ["./home-card-my-events.component.scss"],
	standalone: false,
})
export class HomeCardMyEventsComponent implements OnInit {
	myEvents?: BackendApiTypes.EventResponseWithLinks[];

	constructor(private api: ApiService) {}

	ngOnInit(): void {
		this.loadMyEvents();
	}

	async loadMyEvents() {
		// TODO: list only my events
		this.myEvents = await this.api.EventsApi.listEvents({ my: true }).then((res) => res.data);
		this.myEvents.sort((a, b) => b.dateFrom.localeCompare(a.dateFrom));
	}
}
