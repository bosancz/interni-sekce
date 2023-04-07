import { Injectable } from "@angular/core";
import { DateTime } from "luxon";
import { Subject } from "rxjs";
import { Event } from "src/app/schema/event";
import { ApiService } from "src/app/services/api.service";

@Injectable({
  providedIn: "root",
})
export class ProgramService {
  pendingEventsCount = new Subject<number>();

  constructor(private api: ApiService) {}

  async loadEventsCount() {
    const options = {
      limit: 99,
      filter: {
        dateFrom: { $gte: DateTime.local().toISODate() },
        status: "pending",
      },
      select: "_id",
    };

    const events = await this.api.get<Event[]>("events", options);

    this.pendingEventsCount.next(events.length);
  }
}
