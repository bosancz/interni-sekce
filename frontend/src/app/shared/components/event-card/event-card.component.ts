import { Component, EventEmitter, Input, OnInit, Output } from "@angular/core";
import { Platform } from "@ionic/angular";
import { ApiService } from "src/app/services/api.service";
import { SDK } from "src/sdk";

@Component({
	selector: "event-card",
	templateUrl: "./event-card.component.html",
	styleUrls: ["./event-card.component.scss"],
	standalone: false,
})
export class EventCardComponent implements OnInit {
	@Input()
	event?: SDK.EventResponseWithLinks;

	@Input()
	set eventId(eventId: number) {
		this.loadEvent(eventId);
	}

	@Input() actions: boolean = false;
	@Input() open: boolean = false;

	@Output()
	change = new EventEmitter<SDK.EventResponseWithLinks>();

	constructor(
		private api: ApiService,
		public platform: Platform,
	) {}

	ngOnInit() {}

	async loadEvent(eventId: number) {
		this.event = await this.api.EventsApi.getEvent(eventId).then((res) => res.data);
	}

	async reload() {
		if (this.event && this.event.id) return this.loadEvent(this.event.id);
	}

	async eventAction(
		event: SDK.EventResponseWithLinks,
		action: "submitEvent" | "rejectEvent" | "publishEvent" | "unpublishEvent" | "cancelEvent" | "uncancelEvent",
	) {
		const statusNote = window.prompt("Poznámka pro správce programu (můžeš nechat prázdné):");
		if (statusNote === null) return;

		await this.api.EventsApi[action](event.id, { statusNote });

		await this.reload();
		this.change.emit(this.event);
	}

	async rejectEvent(event: SDK.EventResponseWithLinks) {
		const statusNote = window.prompt("Poznámka k vrácení akce:");
		if (statusNote === null) return;

		await this.api.EventsApi.rejectEvent(event.id, { statusNote });

		await this.reload();
		this.change.emit(this.event);
	}
}
