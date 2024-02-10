import { Injectable } from "@angular/core";
import { DateTime } from "luxon";
import { BehaviorSubject } from "rxjs";
import { EventResponseWithLinks, EventUpdateBody } from "src/app/api";
import { ApiService } from "src/app/services/api.service";

@Injectable({
  providedIn: "root",
})
export class EventsService {
  event$ = new BehaviorSubject<EventResponseWithLinks | undefined>(undefined);

  constructor(private api: ApiService) {}

  async loadEvent(eventId: number): Promise<EventResponseWithLinks> {
    const event = await this.api.events.getEvent(eventId).then((res) => res.data);

    event.attendees?.sort((a, b) => (a.member!.nickname || "").localeCompare(b.member!.nickname || ""));

    event.dateFrom = DateTime.fromISO(event.dateFrom).toISODate()!;
    event.dateTill = DateTime.fromISO(event.dateTill).toISODate()!;

    this.event$.next(event);

    return event;
  }

  async deleteEvent(eventId: number) {
    await this.api.events.deleteEvent(eventId);
  }

  async listEvents(options: any) {
    // TODO: implement options
    return this.api.events.listEvents();
  }

  async updateEvent(eventId: number, data: Partial<EventUpdateBody>) {
    return this.api.events.updateEvent(eventId, data);
  }
}
