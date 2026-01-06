import { DatePipe } from "@angular/common";
import { Component, OnInit, signal } from "@angular/core";
import { FormsModule } from "@angular/forms";
import { ModalController } from "@ionic/angular";
import {
    IonButton,
    IonButtons,
    IonContent,
    IonItem,
    IonLabel,
    IonList,
    IonSearchbar,
    IonToolbar,
} from "@ionic/angular/standalone";
import { ApiService } from "src/app/services/api.service";
import { DateRangePipe } from "src/app/shared/pipes/date-range.pipe";
import { SDK } from "src/sdk";

@Component({
	selector: "bo-event-selector-modal",
	templateUrl: "./event-selector-modal.component.html",
	styleUrls: ["./event-selector-modal.component.scss"],
	
	imports: [
		IonToolbar,
		IonSearchbar,
		IonButtons,
		IonButton,
		IonContent,
		IonList,
		IonItem,
		IonLabel,
		FormsModule,
		DateRangePipe,
		DatePipe,
	],
})
export class EventSelectorModalComponent implements OnInit {
	events = signal<SDK.EventResponseWithLinks[]>([]);

	constructor(
		private api: ApiService,
		private modalController: ModalController,
	) {}

	ngOnInit(): void {
		this.searchEvents();
	}

	async searchEvents(searchString?: string) {
		const params = {
			search: searchString || undefined,
			sort: "-dateFrom",
			limit: 20,
		};

		// TODO: use params
		const events = await this.api.EventsApi.listEvents().then((res) => res.data);
		this.events.set(events);
	}

	close(eventId?: SDK.EventResponseWithLinks["id"]) {
		this.modalController.dismiss({ event: eventId });
	}
}
