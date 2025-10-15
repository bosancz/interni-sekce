import { Injectable } from "@angular/core";
import { DateTime } from "luxon";
import { BehaviorSubject } from "rxjs";

@Injectable({
	providedIn: "root",
})
export class EventsService {
	event$ = new BehaviorSubject<BackendApiTypes.EventResponseWithLinks | undefined>(undefined);

	constructor(private api: BackendApi) {}

	async loadEvent(eventId: number): Promise<BackendApiTypes.EventResponseWithLinks> {
		const event = await this.api.EventsApi.getEvent(eventId).then((res) => res.data);

		event.attendees?.sort((a, b) => (a.member!.nickname || "").localeCompare(b.member!.nickname || ""));

		event.dateFrom = DateTime.fromISO(event.dateFrom).toISODate()!;
		event.dateTill = DateTime.fromISO(event.dateTill).toISODate()!;

		this.event$.next(event);

		return event;
	}

	async deleteEvent(eventId: number) {
		await this.api.EventsApi.deleteEvent(eventId);
	}

	async listEvents(options: any) {
		// TODO: implement options
		return this.api.EventsApi.listEvents();
	}

	async updateEvent(eventId: number, data: Partial<BackendApiTypes.EventUpdateBody>) {
		return this.api.EventsApi.updateEvent(eventId, data);
	}
}
