import { Injectable } from "@angular/core";
import { DateTime } from "luxon";
import { BehaviorSubject } from "rxjs";
import { Event } from "src/app/schema/event";
import { ApiService } from "src/app/services/api.service";

@Injectable({
  providedIn: "root",
})
export class EventsService {
  event$ = new BehaviorSubject<Event | undefined>(undefined);

  constructor(private api: ApiService) {}

  async loadEvent(eventId: string): Promise<Event> {
    const event = await this.api.get<Event>(["event", eventId], { populate: ["leaders"] });

    event.attendees?.sort((a, b) => (a.nickname || "").localeCompare(b.nickname || ""));

    event.dateFrom = DateTime.fromISO(event.dateFrom).toISODate();
    event.dateTill = DateTime.fromISO(event.dateTill).toISODate();

    this.event$.next(event);

    return event;
  }

  async deleteEvent(eventId: string) {
    await this.api.events.deleteEvent(["event", eventId]);
  }

  async listEvents(options: any) {
    return this.api.get<Event[]>("events", options);
  }

  async updateEvent(eventId: string, data: Partial<Event>) {
    return this.api.patch<Event>(["event", eventId], data);
  }
}
