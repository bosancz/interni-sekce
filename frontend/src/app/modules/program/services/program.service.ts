import { Injectable } from "@angular/core";
import { DateTime } from "luxon";
import { Subject } from "rxjs";
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

    // TODO: list events above
    const events = await this.api.events.listEvents().then((res) => res.data);

    this.pendingEventsCount.next(events.length);
  }
}
