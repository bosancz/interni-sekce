import { Component, OnInit } from "@angular/core";
import { ModalController } from "@ionic/angular";

@Component({
	selector: "bo-event-selector-modal",
	templateUrl: "./event-selector-modal.component.html",
	styleUrls: ["./event-selector-modal.component.scss"],
	standalone: false,
})
export class EventSelectorModalComponent implements OnInit {
	events: BackendApiTypes.EventResponseWithLinks[] = [];

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
		this.events = await this.api.EventsApi.listEvents().then((res) => res.data);
	}

	close(eventId?: BackendApiTypes.EventResponseWithLinks["id"]) {
		this.modalController.dismiss({ event: eventId });
	}
}
