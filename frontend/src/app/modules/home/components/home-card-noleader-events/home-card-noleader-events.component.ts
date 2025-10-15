import { Component, OnInit } from "@angular/core";

@Component({
	selector: "bo-home-card-noleader-events",
	templateUrl: "./home-card-noleader-events.component.html",
	styleUrls: ["./home-card-noleader-events.component.scss"],
	standalone: false,
})
export class HomeCardNoleaderEventsComponent implements OnInit {
	events: BackendApiTypes.EventResponseWithLinks[] = [];

	constructor(private api: BackendApi) {}

	ngOnInit(): void {
		this.loadNoLeaderEvents();
	}

	async loadNoLeaderEvents() {
		// TODO: list only noleader events
		this.events = await this.api.EventsApi.listEvents().then((res) => res.data);
	}
}
