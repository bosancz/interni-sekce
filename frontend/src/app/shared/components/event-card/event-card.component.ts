import { NgTemplateOutlet } from "@angular/common";
import { Component, effect, input, OnInit, output } from "@angular/core";
import { RouterLink } from "@angular/router";
import { IonButton, IonButtons, IonItem, IonLabel } from "@ionic/angular/standalone";
import { ApiService } from "src/app/core/services/api.service";
import { SDK } from "src/sdk";
import { DateRangePipe } from "../../pipes/date-range.pipe";
import { EventStatusPipe } from "../../pipes/event-status.pipe";
import { EventPipe } from "../../pipes/event.pipe";
import { JoinLeadersPipe } from "../../pipes/join-leaders.pipe";
import { MarkdownPipe } from "../../pipes/markdown.pipe";
import { CardContentComponent } from "../card-content/card-content.component";
import { CardFooterComponent } from "../card-footer/card-footer.component";
import { CardHeaderComponent } from "../card-header/card-header.component";
import { CardStatusBarComponent } from "../card-status-bar/card-status-bar.component";
import { CardTitleComponent } from "../card-title/card-title.component";
import { CardComponent } from "../card/card.component";

@Component({
	selector: "event-card",
	templateUrl: "./event-card.component.html",
	styleUrls: ["./event-card.component.scss"],

	imports: [
		NgTemplateOutlet,
		RouterLink,
		IonItem,
		IonLabel,
		IonButton,
		IonButtons,
		DateRangePipe,
		EventPipe,
		EventStatusPipe,
		JoinLeadersPipe,
		MarkdownPipe,
		CardComponent,
		CardContentComponent,
		CardHeaderComponent,
		CardStatusBarComponent,
		CardTitleComponent,
		CardFooterComponent,
	],
})
export class EventCardComponent implements OnInit {
	event = input<SDK.EventResponseWithLinks | undefined>();
	eventId = input<number | undefined>();
	actions = input<boolean>(false);
	open = input<boolean>(false);

	change = output<SDK.EventResponseWithLinks>();

	private _loadedEvent?: SDK.EventResponseWithLinks;

	constructor(private api: ApiService) {
		effect(() => {
			const eventId = this.eventId();
			if (eventId) this.loadEvent(eventId);
		});
	}

	ngOnInit() {}

	async loadEvent(eventId: number) {
		this._loadedEvent = await this.api.EventsApi.getEvent(eventId).then((res) => res.data);
	}

	getEvent(): SDK.EventResponseWithLinks | undefined {
		// Prefer the freshly reloaded event over the bound input: after a status
		// action we reload() into _loadedEvent, and the card (and the event it
		// emits to the parent) must reflect the new status/_links, otherwise the
		// stale buttons re-trigger no-longer-applicable actions and 403.
		return this._loadedEvent ?? this.event();
	}

	async reload() {
		const event = this.getEvent();
		if (event && event.id) return this.loadEvent(event.id);
	}

	async eventAction(
		event: SDK.EventResponseWithLinks,
		action: "submitEvent" | "rejectEvent" | "publishEvent" | "unpublishEvent" | "cancelEvent" | "uncancelEvent",
	) {
		const statusNote = window.prompt("Poznámka pro správce programu (můžeš nechat prázdné):");
		if (statusNote === null) return;

		await this.api.EventsApi[action](event.id, { statusNote });

		await this.reload();
		const updatedEvent = this.getEvent();
		if (updatedEvent) this.change.emit(updatedEvent);
	}

	async rejectEvent(event: SDK.EventResponseWithLinks) {
		const statusNote = window.prompt("Poznámka k vrácení akce:");
		if (statusNote === null) return;

		await this.api.EventsApi.rejectEvent(event.id, { statusNote });

		await this.reload();
		const updatedEvent = this.getEvent();
		if (updatedEvent) this.change.emit(updatedEvent);
	}
}
