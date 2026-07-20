import { AsyncPipe } from "@angular/common";
import { Component, OnInit, signal } from "@angular/core";
import {
	InfiniteScrollCustomEvent,
	IonInfiniteScroll,
	IonInfiniteScrollContent,
	IonRefresher,
	IonRefresherContent,
	RefresherCustomEvent,
} from "@ionic/angular/standalone";
import { addIcons } from "ionicons";
import { addOutline, printOutline } from "ionicons/icons";
import { DateTime } from "luxon";
import { ApiService } from "src/app/core/services/api.service";
import { ModalService } from "src/app/core/services/modal.service";
import { PlatformService } from "src/app/core/services/platform.service";
import { ToastService } from "src/app/core/services/toast.service";
import { EventCreateModalComponent } from "src/app/features/events/components/event-create-modal/event-create-modal.component";
import { ProgramPrintModalComponent } from "src/app/features/home/components/program-print-modal/program-print-modal.component";
import { Action } from "src/app/shared/components/action-buttons/action-buttons.component";
import { EventCalendarComponent } from "src/app/shared/components/event-calendar/event-calendar.component";
import { PageContentComponent } from "src/app/shared/components/page-content/page-content.component";
import { PageHeaderComponent } from "src/app/shared/components/page-header/page-header.component";
import { SDK } from "src/sdk";

@Component({
	selector: "bo-home-calendar",
	templateUrl: "./home-calendar.component.html",
	styleUrls: ["./home-calendar.component.scss"],

	imports: [
		EventCalendarComponent,
		PageContentComponent,
		PageHeaderComponent,
		IonInfiniteScroll,
		IonInfiniteScrollContent,
		IonRefresher,
		IonRefresherContent,
		AsyncPipe,
	],
})
export class HomeCalendarComponent implements OnInit {
	dateFrom = signal(DateTime.local().minus({ weeks: 2 }));
	dateTill = signal(DateTime.local().plus({ years: 1 }));

	addEventEnabled = signal(false);

	events = signal<SDK.EventResponseWithLinks[]>([]);

	actions = signal<Action[]>([
		{
			text: "Přidat akci",
			icon: "add-outline",
			pinned: false,
			handler: () => this.enableAddEvent(),
		},
		{
			text: "Tisk programu",
			icon: "print-outline",
			pinned: false,
			handler: () => this.openPrintModal(),
		},
	]);

	constructor(
		private api: ApiService,
		private readonly modalService: ModalService,
		private readonly toastService: ToastService,
		public readonly platformService: PlatformService,
	) {
		addIcons({ printOutline, addOutline });
	}

	ngOnInit(): void {
		this.loadEvents();
	}

	async loadEvents() {
		console.log("Loading events from", this.dateFrom().toISODate(), "to", this.dateTill().toISODate());
		const events = await this.api.EventsApi.listEvents({
			dateTill: this.dateTill().toISODate(),
			dateFrom: this.dateFrom().toISODate(),
		}).then((res) => res.data);

		this.events.set(events);
	}

	async loadMorePrevious(event?: RefresherCustomEvent) {
		this.dateFrom.update((dateFrom) => dateFrom.minus({ months: 1 }));
		await this.loadEvents();
		event?.target.complete();
	}

	async loadMoreFuture(event?: InfiniteScrollCustomEvent) {
		this.dateTill.update((dateTill) => dateTill.plus({ months: 1 }));
		await this.loadEvents();
		event?.target.complete();
	}

	private enableAddEvent() {
		this.addEventEnabled.set(true);
		this.toastService.toast("Vyberte počátek a konec akce kliknutím v kalendáři.", {
			buttons: [{ text: "Přidat ručně", handler: () => this.createEvent() }],
		});
	}

	async createEvent(dates?: [DateTime, DateTime]) {
		const eventData = await this.modalService.componentModal(EventCreateModalComponent, {
			data: {
				dateFrom: dates?.[0].toISODate() ?? undefined,
				dateTill: dates?.[1].toISODate() ?? undefined,
			},
		});

		if (!eventData) return;

		await this.api.EventsApi.createEvent(eventData);

		await this.loadEvents();

		this.toastService.toast("Akce vytvořena.");
	}

	private async openPrintModal() {
		await this.modalService.componentModal(ProgramPrintModalComponent);
	}
}
