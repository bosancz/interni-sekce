import { Component, OnInit } from "@angular/core";
import { EventResponse } from "src/app/api";
import { ApiService } from "src/app/services/api.service";

@Component({
  selector: "bo-noleader-events",
  templateUrl: "./noleader-events.component.html",
  styleUrls: ["./noleader-events.component.scss"],
})
export class NoleaderEventsComponent implements OnInit {
  events: EventResponse[] = [];

  constructor(private api: ApiService) {}

  ngOnInit(): void {
    this.loadNoLeaderEvents();
  }

  async loadNoLeaderEvents() {
    // TODO: list only noleader events
    this.events = await this.api.events.listEvents().then((res) => res.data);
  }
}
