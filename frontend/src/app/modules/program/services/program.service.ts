import { Injectable } from "@angular/core";
import { Subject } from "rxjs";
import { ApiService } from "src/app/services/api.service";

@Injectable({
	providedIn: "root",
})
export class ProgramService {
	pendingEventsCount = new Subject<number>();

	constructor(private api: ApiService) {}

	async loadEventsCount() {
		// TODO: filter only future events
		const events = await this.api
			.get("/api/events", {
				query: {
					limit: 99,
					status: "pending",
				},
			})
			.then((res) => res.data);

		this.pendingEventsCount.next(events.length);
	}
}
