import { Component, Input, OnInit } from "@angular/core";
import { DateTime } from "luxon";
import { EventResponseWithLinks } from "src/app/api";
import { ApiService } from "src/app/services/api.service";

@Component({
  selector: "bo-home-calendar",
  templateUrl: "./home-calendar.component.html",
  styleUrls: ["./home-calendar.component.scss"],
})
export class HomeCalendarComponent implements OnInit {
  dateFrom = DateTime.local();
  dateTill = DateTime.local().plus({ months: 1 });

  events: EventResponseWithLinks[] = [];

  @Input() months: number = 1;

  constructor(private api: ApiService) {}

  ngOnInit(): void {
    this.loadCalendarEvents();
  }

  async loadCalendarEvents() {
    const options: any = {
      sort: "dateFrom",
    };

    this.dateTill = DateTime.local().plus({ months: 1 });

    options.filter = {
      dateTill: { $gte: this.dateFrom.toISODate() },
      dateFrom: { $lte: this.dateTill.toISODate() },
    };

    // TODO: use options above
    this.events = await this.api.events.listEvents().then((res) => res.data);
  }
}
