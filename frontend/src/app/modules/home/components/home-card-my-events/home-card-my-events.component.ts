import { Component, OnInit } from "@angular/core";
import { Event } from "src/app/schema/event";
import { ApiService } from "src/app/services/api.service";

@Component({
  selector: "bo-home-card-my-events",
  templateUrl: "./home-card-my-events.component.html",
  styleUrls: ["./home-card-my-events.component.scss"],
})
export class HomeCardMyEventsComponent implements OnInit {
  myEvents: Event[] = [];
  noLeaderEvents: Event[] = [];

  constructor(private api: ApiService) {}

  ngOnInit(): void {
    this.loadMyEvents();
  }

  async loadMyEvents() {
    this.myEvents = await this.api.get<Event[]>("me:events");
    this.myEvents.sort((a, b) => b.dateFrom.localeCompare(a.dateFrom));
  }
}
