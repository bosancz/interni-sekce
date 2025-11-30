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
	hasMore: boolean = false;

	constructor(private api: ApiService) {}

	ngOnInit(): void {
		this.loadNoLeaderEvents();
	}

	async loadNoLeaderEvents() {
		// TODO: list only noleader events
		const events = await this.api.EventsApi.listEvents({ limit: 6, noleader: true }).then((res) => res.data);
		this.hasMore = events.length > 5;
		this.events = events.slice(0, 5);
	}
}
