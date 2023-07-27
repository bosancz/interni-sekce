import { Component, OnInit } from "@angular/core";
import { EventResponseWithLinks } from "src/app/api";
import { ApiService } from "src/app/services/api.service";

@Component({
  selector: "bo-home-card-noleader-events",
  templateUrl: "./home-card-noleader-events.component.html",
  styleUrls: ["./home-card-noleader-events.component.scss"],
})
export class HomeCardNoleaderEventsComponent implements OnInit {
  events: EventResponseWithLinks[] = [];

  constructor(private api: ApiService) {}

  ngOnInit(): void {
    this.loadNoLeaderEvents();
  }

  async loadNoLeaderEvents() {
    // TODO: list only noleader events
    this.events = await this.api.events.listEvents().then((res) => res.data);
  }
}
