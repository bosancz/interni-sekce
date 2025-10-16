import { Component, EventEmitter, Input, OnInit, Output } from "@angular/core";
import { Platform } from "@ionic/angular";
import { ApiService } from "src/app/services/api.service";
import { BackendApiTypes } from "src/sdk/backend.client";

@Component({
	selector: "event-card",
	templateUrl: "./event-card.component.html",
	styleUrls: ["./event-card.component.scss"],
	standalone: false,
})
export class EventCardComponent implements OnInit {
	@Input()
	event?: BackendApiTypes.EventResponseWithLinks;

	@Input()
	set eventId(eventId: number) {
		this.loadEvent(eventId);
	}

	@Input() actions: boolean = false;
	@Input() open: boolean = false;

	@Output()
	change = new EventEmitter<BackendApiTypes.EventResponseWithLinks>();

	constructor(
		private api: ApiService,
		public platform: Platform,
	) {}

	ngOnInit() {}

	async loadEvent(eventId: number) {
		this.event = await this.api.get("/api/events/{id}", { params: { id: eventId } }).then((res) => res.data);
	}

	async reload() {
		if (this.event && this.event.id) return this.loadEvent(this.event.id);
	}

	async eventAction(
		event: BackendApiTypes.EventResponseWithLinks,
		action: "submitEvent" | "rejectEvent" | "publishEvent" | "unpublishEvent" | "cancelEvent" | "uncancelEvent",
	) {
		const statusNote = window.prompt("Poznámka pro správce programu (můžeš nechat prázdné):");
		if (statusNote === null) return;

		await this.api.post(action, { statusNote }, { params: { id: event.id } });

		await this.reload();
		this.change.emit(this.event);
	}

	async rejectEvent(event: BackendApiTypes.EventResponseWithLinks) {
		const statusNote = window.prompt("Poznámka k vrácení akce:");
		if (statusNote === null) return;

		await this.api.post("/api/events/{id}/reject", { statusNote }, { params: { id: event.id } });

		await this.reload();
		this.change.emit(this.event);
	}
}
