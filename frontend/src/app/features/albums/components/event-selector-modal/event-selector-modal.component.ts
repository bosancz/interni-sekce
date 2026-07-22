import { Component, OnInit, signal } from "@angular/core";
import { FormsModule } from "@angular/forms";
import {
	InfiniteScrollCustomEvent,
	IonButton,
	IonButtons,
	IonContent,
	IonInfiniteScroll,
	IonInfiniteScrollContent,
	IonItem,
	IonLabel,
	IonList,
	IonSearchbar,
	IonToolbar,
	ModalController,
} from "@ionic/angular/standalone";
import { ApiService } from "src/app/core/services/api.service";
import { InputModalComponent } from "src/app/core/services/modal.service";
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
		IonInfiniteScroll,
		IonInfiniteScrollContent,
		FormsModule,
		DateRangePipe,
	],
})
export class EventSelectorModalComponent extends InputModalComponent<SDK.EventResponseWithLinks> implements OnInit {
	events = signal<SDK.EventResponseWithLinks[] | undefined>(undefined);

	pageSize = 20;
	page = signal(1);
	searchString = signal<string | undefined>(undefined);

	constructor(
		private api: ApiService,
		modalController: ModalController,
	) {
		super(modalController);
	}

	ngOnInit(): void {
		this.loadEvents();
	}

	async searchEvents(searchString?: string) {
		this.searchString.set(searchString || undefined);
		await this.loadEvents();
	}

	async onInfiniteScroll(e: InfiniteScrollCustomEvent) {
		await this.loadEvents(true);
		e.target.complete();
	}

	private async loadEvents(loadMore = false) {
		if (loadMore) {
			const currentEvents = this.events();
			if (currentEvents && currentEvents.length < this.page() * this.pageSize) return;
			this.page.set(this.page() + 1);
		} else {
			this.page.set(1);
			this.events.set(undefined);
		}

		const params: SDK.EventsApiListEventsQueryParams = {
			search: this.searchString(),
			offset: (this.page() - 1) * this.pageSize,
			limit: this.pageSize,
		};

		const newEvents = await this.api.EventsApi.listEvents(params).then((res) => res.data);

		const currentEvents = this.events();
		this.events.set(currentEvents ? [...currentEvents, ...newEvents] : newEvents);
	}
}
