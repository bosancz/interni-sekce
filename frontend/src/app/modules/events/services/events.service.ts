import { Injectable } from "@angular/core";
import { DateTime } from "luxon";
import { BehaviorSubject } from "rxjs";
import { ApiService } from "src/app/services/api.service";
import { SDK } from "src/sdk";

@Injectable({
	providedIn: "root",
})
export class EventsService {
	event$ = new BehaviorSubject<SDK.EventResponseWithLinks | undefined>(undefined);

	constructor(private api: ApiService) {}

	async loadEvent(eventId: number): Promise<SDK.EventResponseWithLinks> {
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

	async updateEvent(eventId: number, data: Partial<SDK.EventUpdateBody>) {
		return this.api.EventsApi.updateEvent(eventId, data);
	}
}
