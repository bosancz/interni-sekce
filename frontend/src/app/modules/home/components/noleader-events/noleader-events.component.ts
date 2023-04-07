import { Component, OnInit } from "@angular/core";
import { Event } from "src/app/schema/event";
import { ApiService } from "src/app/services/api.service";

@Component({
  selector: "bo-noleader-events",
  templateUrl: "./noleader-events.component.html",
  styleUrls: ["./noleader-events.component.scss"],
})
export class NoleaderEventsComponent implements OnInit {
  events: Event[] = [];

  constructor(private api: ApiService) {}

  ngOnInit(): void {
    this.loadNoLeaderEvents();
  }

  async loadNoLeaderEvents() {
    this.events = await this.api.get<Event[]>("events:noleader", { sort: "dateFrom" });
  }
}
