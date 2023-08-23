import { Component, OnInit } from "@angular/core";
import { EventResponseWithLinks } from "src/app/api";
import { ApiService } from "src/app/services/api.service";

@Component({
  selector: "bo-home-card-my-events",
  templateUrl: "./home-card-my-events.component.html",
  styleUrls: ["./home-card-my-events.component.scss"],
})
export class HomeCardMyEventsComponent implements OnInit {
  myEvents?: EventResponseWithLinks[];

  constructor(private api: ApiService) {}

  ngOnInit(): void {
    this.loadMyEvents();
  }

  async loadMyEvents() {
    // TODO: list only my events
    this.myEvents = await this.api.events.listEvents({ my: true }).then((res) => res.data);
    this.myEvents.sort((a, b) => b.dateFrom.localeCompare(a.dateFrom));
  }
}
