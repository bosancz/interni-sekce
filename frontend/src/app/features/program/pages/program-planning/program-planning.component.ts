import { Component, OnDestroy, OnInit, signal } from "@angular/core";
import { FormsModule } from "@angular/forms";
import { ActivatedRoute, Params, Router } from "@angular/router";
import {
	IonBackButton,
	IonButtons,
	IonContent,
	IonHeader,
	IonTitle,
	IonToolbar,
	ViewWillEnter,
} from "@ionic/angular/standalone";
import { DateTime } from "luxon";
import { Subscription } from "rxjs";
import { EventStatuses } from "src/app/core/config/event-statuses";
import { ApiService } from "src/app/core/services/api.service";
import { ModalService } from "src/app/core/services/modal.service";
import { ToastService } from "src/app/core/services/toast.service";
import { EventCreateModalComponent } from "src/app/features/events/components/event-create-modal/event-create-modal.component";
import { EventCalendarComponent } from "src/app/shared/components/event-calendar/event-calendar.component";
import { SDK } from "src/sdk";
import { EventStatusLegendComponent } from "../../components/event-status-legend/event-status-legend.component";
import { TrimesterSelectorComponent } from "../../components/trimester-selector/trimester-selector.component";

@Component({
	selector: "program-planning",
	templateUrl: "./program-planning.component.html",
	styleUrls: ["./program-planning.component.scss"],

	imports: [
		FormsModule,
		IonContent,
		IonHeader,
		IonToolbar,
		IonButtons,
		IonBackButton,
		IonTitle,
		EventCalendarComponent,
		TrimesterSelectorComponent,
		EventStatusLegendComponent,
	],
})
export class ProgramPlanningComponent implements OnInit, OnDestroy, ViewWillEnter {
	dateFrom = signal<DateTime | undefined>(undefined);
	dateTill = signal<DateTime | undefined>(undefined);

	events = signal<SDK.EventResponseWithLinks[]>([]);

	statuses = EventStatuses;

	paramsSubscription?: Subscription;

	constructor(
		private api: ApiService,
		private router: Router,
		private route: ActivatedRoute,
		private toastService: ToastService,
		private modalService: ModalService,
	) {}

	ngOnInit() {
		this.paramsSubscription = this.route.queryParams.subscribe((params: Params) => {
			if (params.dateFrom && params.dateTill) {
				this.dateFrom.set(DateTime.fromISO(params.dateFrom));
				this.dateTill.set(DateTime.fromISO(params.dateTill));

				this.loadEvents();
			}
		});
	}

	ionViewWillEnter() {
		this.loadEvents();
	}

	ngOnDestroy() {
		this.paramsSubscription?.unsubscribe();
	}

	async loadEvents() {
		const dateTill = this.dateTill();
		const dateFrom = this.dateFrom();
		if (!dateTill || !dateFrom) return;

		const requestOptions = {
			filter: {
				dateFrom: { $lte: dateTill.toISODate() },
				dateTill: { $gte: dateFrom.toISODate() },
			},
			select: "_id name status type dateFrom dateTill timeFrom timeTill",
		};

		// TODO: use options above
		const events = await this.api.EventsApi.listEvents().then((res: any) => res.data);
		this.events.set(events);
	}

	setPeriod(period: [string, string]) {
		const params = {
			dateFrom: period[0],
			dateTill: period[1],
		};
		this.router.navigate(["./"], { queryParams: params, relativeTo: this.route, replaceUrl: true });
	}

	async createEvent([dateFrom, dateTill]: [DateTime, DateTime]) {
		const eventData = await this.modalService.componentModal(EventCreateModalComponent, {
			data: {
				dateFrom: dateFrom.toISODate() ?? undefined,
				dateTill: dateTill.toISODate() ?? undefined,
			},
		});

		if (!eventData) return;

		await this.api.EventsApi.createEvent(eventData);

		await this.loadEvents();

		this.toastService.toast("Akce vytvořena.");
	}
}
