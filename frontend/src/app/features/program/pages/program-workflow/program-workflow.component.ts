import { formatDate, NgTemplateOutlet } from "@angular/common";
import { Component, computed, OnInit, signal } from "@angular/core";
import { toSignal } from "@angular/core/rxjs-interop";
import { IonButton, IonIcon } from "@ionic/angular/standalone";
import { Router } from "@angular/router";
import { addIcons } from "ionicons";
import { addOutline, calendarOutline, createOutline, hourglassOutline } from "ionicons/icons";
import { BehaviorSubject } from "rxjs";
import { map } from "rxjs/operators";
import { ApiService } from "src/app/core/services/api.service";
import { ModalService } from "src/app/core/services/modal.service";
import { ToastService } from "src/app/core/services/toast.service";
import { PageContentComponent } from "src/app/shared/components/page-content/page-content.component";
import { PageFooterComponent } from "src/app/shared/components/page-footer/page-footer.component";
import { PageHeaderComponent } from "src/app/shared/components/page-header/page-header.component";
import { TabComponent } from "src/app/shared/components/tab/tab.component";
import { TabsComponent } from "src/app/shared/components/tabs/tabs.component";
import { SDK } from "src/sdk";
import { EventListItemComponent } from "../../components/event-list-item/event-list-item.component";
import { EventReviewCardComponent } from "../../components/event-review-card/event-review-card.component";
import { ProgramEventAction } from "../../program-event-action";
import { EventCreateModalComponent } from "../../../events/components/event-create-modal/event-create-modal.component";

@Component({
	selector: "program-workflow",
	templateUrl: "./program-workflow.component.html",
	styleUrls: ["./program-workflow.component.scss"],

	imports: [
		NgTemplateOutlet,
		IonButton,
		IonIcon,
		EventListItemComponent,
		EventReviewCardComponent,
		PageHeaderComponent,
		PageContentComponent,
		PageFooterComponent,
		TabsComponent,
		TabComponent,
	],
})
export class ProgramWorkflowComponent implements OnInit {
	selectedColumn = signal("pending");

	events = new BehaviorSubject<undefined | SDK.EventResponseWithLinks[]>([]);

	private allEvents = toSignal(this.events.pipe(map((events) => events ?? [])), { initialValue: [] });

	draftEvents = computed(() =>
		this.allEvents()
			.filter((event) => ["draft", "rejected"].includes(event.status))
			.sort((a, b) => (a.dateFrom ?? "9999").localeCompare(b.dateFrom ?? "9999")),
	);
	pendingEvents = computed(() => this.allEvents().filter((event) => event.status === "pending"));
	publicEvents = computed(() => this.allEvents().filter((event) => ["public", "cancelled"].includes(event.status)));

	publicEventsByMonth = computed(() => {
		const sorted = [...this.publicEvents()].sort((a, b) =>
			(a.dateFrom ?? "9999").localeCompare(b.dateFrom ?? "9999"),
		);
		const months: { label: string; events: SDK.EventResponseWithLinks[] }[] = [];
		for (const event of sorted) {
			const label = event.dateFrom ? this.monthLabel(event.dateFrom) : "Bez data";
			const last = months[months.length - 1];
			if (last?.label === label) last.events.push(event);
			else months.push({ label, events: [event] });
		}
		return months;
	});

	pendingLabel = computed(() => {
		const count = this.pendingEvents().length;
		return count >= 2 && count <= 4 ? "čekají" : "čeká";
	});

	loading = signal(true);

	constructor(
		private api: ApiService,
		private modalService: ModalService,
		private toastService: ToastService,
		private router: Router,
	) {
		addIcons({ createOutline, hourglassOutline, calendarOutline, addOutline });
	}

	ngOnInit() {
		this.loadEvents();
	}

	async loadEvents() {
		this.events.next([]);
		this.loading.set(true);

		const events = await this.api.EventsApi.listEvents({
			dateFrom: formatDate(new Date(), "yyyy-MM-dd", "cs"),
		}).then((res) => res.data);

		this.events.next(events);

		this.loading.set(false);
	}

	eventChanged(newEvent: SDK.EventResponseWithLinks) {
		const events = [...(this.events.value ?? [])];
		const i = events.findIndex((event) => event.id === newEvent.id);
		if (i >= 0) {
			events.splice(i, 1, newEvent);
		} else {
			events.push(newEvent);
		}
		this.events.next(events);
	}

	async eventAction(event: SDK.EventResponseWithLinks, action: ProgramEventAction) {
		const statusNote = window.prompt(
			action === "rejectEvent"
				? "Poznámka k vrácení akce:"
				: "Poznámka pro správce programu (můžeš nechat prázdné):",
		);
		if (statusNote === null) return;

		await this.api.EventsApi[action](event.id, { statusNote });

		const updatedEvent = await this.api.EventsApi.getEvent(event.id).then((res) => res.data);
		this.eventChanged(updatedEvent);
	}

	private monthLabel(date: string) {
		const label = formatDate(date, "LLLL y", "cs");
		return label.charAt(0).toUpperCase() + label.slice(1);
	}

	async createEvent() {
		const data = await this.modalService.componentModal(EventCreateModalComponent);
		if (!data) return;

		const event = await this.api.EventsApi.createEvent(data).then((res: any) => res.data);
		this.toastService.toast("Akce vytvořena a uložena.");
		this.router.navigate(["/akce/" + event.id]);
	}
}
