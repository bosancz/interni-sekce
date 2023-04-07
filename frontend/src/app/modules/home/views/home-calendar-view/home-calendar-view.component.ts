import { Component, OnInit } from "@angular/core";
import { DateTime } from "luxon";
import { Event } from "src/app/schema/event";
import { ApiService } from "src/app/services/api.service";

@Component({
  selector: "bo-home-calendar-view",
  templateUrl: "./home-calendar-view.component.html",
  styleUrls: ["./home-calendar-view.component.scss"],
})
export class HomeCalendarViewComponent implements OnInit {
  calendarDateFrom = DateTime.local();
  calendarDateTill = DateTime.local().plus({ months: 3 });
  calendarEvents: Event[] = [];

  constructor(private api: ApiService) {}

  ngOnInit(): void {
    this.loadCalendarEvents();
  }

  async loadCalendarEvents() {
    const options: any = {
      sort: "dateFrom",
    };

    options.filter = {
      dateTill: { $gte: this.calendarDateFrom.toISODate() },
      dateFrom: { $lte: this.calendarDateTill.toISODate() },
    };

    this.calendarEvents = await this.api.get<Event[]>("events", options);
  }
}
