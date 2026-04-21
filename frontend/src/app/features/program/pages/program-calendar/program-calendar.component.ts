import { Component, OnDestroy, OnInit, signal } from "@angular/core";
import { FormsModule } from "@angular/forms";
import { ActivatedRoute, Router } from "@angular/router";
import { IonContent, ModalController, ViewWillEnter } from "@ionic/angular/standalone";
import { ModalService } from "src/app/core/services/modal.service";
import { EventsService } from "src/app/features/events/services/events.service";
import { Action } from "src/app/shared/components/action-buttons/action-buttons.component";
import { EventCalendarComponent } from "src/app/shared/components/event-calendar/event-calendar.component";
import { PageHeaderComponent } from "src/app/shared/components/page-header/page-header.component";
import { SDK } from "src/sdk";
import { EventStatusLegendComponent } from "../../components/event-status-legend/event-status-legend.component";
import { ProgramPrintModalComponent } from "../../components/program-print-modal/program-print-modal.component";
import {
	TrimesterDateRange,
	TrimesterSelectorComponent,
} from "../../components/trimester-selector/trimester-selector.component";

@Component({
	selector: "bo-program-calendar",
	templateUrl: "./program-calendar.component.html",
	styleUrls: ["./program-calendar.component.scss"],

	imports: [
		FormsModule,
		IonContent,
		PageHeaderComponent,
		EventCalendarComponent,
		TrimesterSelectorComponent,
		EventStatusLegendComponent,
	],
})
export class ProgramCalendarComponent implements OnInit, OnDestroy, ViewWillEnter {
	dateFrom = signal<string | undefined>(undefined);
	dateTill = signal<string | undefined>(undefined);

	calendarEvents = signal<SDK.EventResponseWithLinks[]>([]);

	showFilter = signal(true);

	actions = signal<Action[]>([]);

	view = signal<"list" | "calendar">("calendar");

	modal?: HTMLIonModalElement;

	lg!: boolean;

	constructor(
		private modalController: ModalController,
		private modalService: ModalService,
		private eventsService: EventsService,
		private route: ActivatedRoute,
		private router: Router,
	) {}

	ngOnInit(): void {
		const lgQuery = window.matchMedia("(min-width: 992px)");

		this.lg = lgQuery.matches;
		this.setActions();

		lgQuery.addEventListener("change", (event) => {
			this.lg = event.matches;
			this.setActions();
		});

		this.route.queryParams.subscribe((params) => {
			const from = params["from"];
			const till = params["till"];
			this.dateFrom.set(from);
			this.dateTill.set(till);
			if (from && till) {
				this.loadCalendarEvents(from, till);
			}
		});
	}

	ionViewWillEnter() {
		const from = this.dateFrom();
		const till = this.dateTill();
		if (from && till) {
			this.loadCalendarEvents(from, till);
		}
	}

	ngOnDestroy() {
		this.modal?.dismiss();
	}

	setTrimester(dateRange: TrimesterDateRange) {
		const queryParams = {
			from: dateRange[0],
			till: dateRange[1],
		};
		this.router.navigate(["./"], { queryParams, replaceUrl: true, relativeTo: this.route });
	}

	async loadCalendarEvents(dateFrom: string, dateTill: string) {
		const options: any = {
			sort: "dateFrom",
			filter: {
				dateTill: { $gte: dateFrom },
				dateFrom: { $lte: dateTill },
			},
		};

		const events = await this.eventsService.listEvents(options).then((res) => res.data);
		this.calendarEvents.set(events);
	}

	// setView(view: "list" | "calendar") {
	//   this.view = view;
	//   this.setActions();
	// }

	async openPrintModal() {
		await this.modalService.componentModal(ProgramPrintModalComponent);
	}

	setActions() {
		this.actions.set([
			{
				text: "Tisk programu",
				icon: "print-outline",
				pinned: true,
				handler: () => this.openPrintModal(),
			},
			// {
			//   text: "Kalendář",
			//   icon: "calendar-outline",
			//   pinned: true,
			//   hidden: this.lg || this.view === "calendar",
			//   handler: () => this.setView("calendar"),
			// },
			// {
			//   text: "Seznam",
			//   icon: "list-outline",
			//   pinned: true,
			//   hidden: this.lg || this.view === "list",
			//   handler: () => this.setView("list"),
			// }
		]);
	}
}
