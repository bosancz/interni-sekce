import { Component, OnInit } from "@angular/core";
import { ApiService } from "src/app/services/api.service";
import { SDK } from "src/sdk";

@Component({
	selector: "bo-home-card-noleader-events",
	templateUrl: "./home-card-noleader-events.component.html",
	styleUrls: ["./home-card-noleader-events.component.scss"],
	standalone: false,
})
export class HomeCardNoleaderEventsComponent implements OnInit {
	events: SDK.EventResponseWithLinks[] = [];

	constructor(private api: ApiService) {}

	ngOnInit(): void {
		this.loadNoLeaderEvents();
	}

	async loadNoLeaderEvents() {
		// TODO: list only noleader events
		this.events = await this.api.EventsApi.listEvents().then((res) => res.data);
	}
}
