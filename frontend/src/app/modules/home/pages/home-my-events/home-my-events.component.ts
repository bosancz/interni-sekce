import { Component, Input, OnInit } from "@angular/core";
import { ActivatedRoute, Router } from "@angular/router";

import { ApiService } from "src/app/services/api.service";

import { DateTime } from "luxon";
import { EventResponseWithLinks } from "src/app/api";

type DashboardMyEventsStats = {
  count: number;
  days: number;
  mandays: number;
};

@Component({
    selector: "bo-home-my-events",
    templateUrl: "./home-my-events.component.html",
    styleUrls: ["./home-my-events.component.scss"],
    standalone: false
})
export class HomeMyEventsComponent implements OnInit {
  @Input() limit?: number;

  title = "Moje akce";

  events: EventResponseWithLinks[] = [];

  stats: DashboardMyEventsStats = {
    count: 0,
    days: 0,
    mandays: 0,
  };

  constructor(private api: ApiService, private router: Router, private route: ActivatedRoute) {}

  ngOnInit() {
    this.loadMyEvents();
  }

  async loadMyEvents() {
    // TODO: list only my events
    this.events = await this.api.events.listEvents().then((res) => res.data);

    this.events.sort((a, b) => b.dateFrom.localeCompare(a.dateFrom));

    if (this.limit) this.events = this.events.slice(0, this.limit);

    this.updateStats();
  }

  updateStats() {
    this.stats = this.events.reduce(
      (stats, event) => {
        stats.count++;

        const dateFrom = DateTime.fromISO(event.dateFrom).set({ hour: 0, minute: 0, second: 0, millisecond: 0 });
        const dateTill = DateTime.fromISO(event.dateTill)
          .set({ hour: 0, minute: 0, second: 0, millisecond: 0 })
          .plus({ days: 1 });

        const days = dateTill.diff(dateFrom, "days").days;

        stats.days += days;

        stats.mandays += days * (event.attendees?.length || 0);

        return stats;
      },
      { count: 0, days: 0, mandays: 0 },
    );
  }

  openLeadEventModal() {
    this.router.navigate(["akce/vest-akci"], { relativeTo: this.route });
  }
}
