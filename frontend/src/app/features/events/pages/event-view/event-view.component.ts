import { Component, computed, signal } from "@angular/core";
import { ActivatedRoute, Router } from "@angular/router";
import { ViewWillEnter, ViewWillLeave } from "@ionic/angular/standalone";
import { UntilDestroy, untilDestroyed } from "@ngneat/until-destroy";
import { addIcons } from "ionicons";
import {
	arrowBackOutline,
	arrowForwardOutline,
	arrowUndoOutline,
	calendar,
	cashOutline,
	closeOutline,
	documentOutline,
	eyeOffOutline,
	eyeOutline,
	handLeftOutline,
	medkitOutline,
	peopleOutline,
} from "ionicons/icons";
import { ApiService } from "src/app/core/services/api.service";
import { ModalService } from "src/app/core/services/modal.service";
import { ToastService } from "src/app/core/services/toast.service";
import { Action } from "src/app/shared/components/action-buttons/action-buttons.component";
import { PageContentComponent } from "src/app/shared/components/page-content/page-content.component";
import { PageFooterComponent } from "src/app/shared/components/page-footer/page-footer.component";
import { PageHeaderComponent } from "src/app/shared/components/page-header/page-header.component";
import { TabComponent } from "src/app/shared/components/tab/tab.component";
import { TabsComponent } from "src/app/shared/components/tabs/tabs.component";
import { VerticalMenuItemComponent } from "src/app/shared/components/vertical-menu-item/vertical-menu-item.component";
import { VerticalMenuComponent } from "src/app/shared/components/vertical-menu/vertical-menu.component";
import { ExtractExisting } from "src/helpers/typings";
import { SDK } from "src/sdk";
import { EventPipe } from "../../../../shared/pipes/event.pipe";
import { EventAccountingComponent } from "../../components/event-accounting/event-accounting.component";
import { EventAttendeesComponent } from "../../components/event-attendees/event-attendees.component";
import { EventInfoComponent } from "../../components/event-info/event-info.component";
import { EventProblemsComponent } from "../../components/event-problems/event-problems.component";
import { EventReportComponent } from "../../components/event-report/event-report.component";

export type EventStatusActions = ExtractExisting<
	keyof SDK.EventResponseWithLinks["_links"],
	"publishEvent" | "unpublishEvent" | "uncancelEvent" | "cancelEvent" | "rejectEvent" | "submitEvent"
>;

@UntilDestroy()
@Component({
	selector: "bo-event-view",
	templateUrl: "./event-view.component.html",
	styleUrl: "./event-view.component.scss",

	imports: [
		EventAttendeesComponent,
		EventProblemsComponent,
		EventAccountingComponent,
		EventReportComponent,
		PageFooterComponent,
		TabsComponent,
		TabComponent,
		PageHeaderComponent,
		PageContentComponent,
		EventPipe,
		EventInfoComponent,
		VerticalMenuComponent,
		VerticalMenuItemComponent,
	],
})
export class EventViewComponent implements ViewWillEnter, ViewWillLeave {
	event = signal<SDK.EventResponseWithLinks | undefined>(undefined);

	actions: Action[] = [];

	view = signal<"info" | "attendees" | "problems" | "accounting" | "registration" | "report">("info");

	attendeesCount = signal<number | undefined>(undefined);
	problemsCount = signal<number | undefined>(undefined);
	expensesCount = signal<number | undefined>(undefined);

	attendeesBadge = computed(() => this.attendeesCount() || undefined);
	problemsBadge = computed(() => this.problemsCount() || undefined);
	expensesBadge = computed(() => this.expensesCount() || undefined);

	constructor(
		private readonly api: ApiService,
		private readonly route: ActivatedRoute,
		private readonly router: Router,
		private readonly toastService: ToastService,
		private readonly modalService: ModalService,
	) {
		addIcons({
			calendar,
			peopleOutline,
			medkitOutline,
			cashOutline,
			documentOutline,
			handLeftOutline,
			arrowForwardOutline,
			arrowBackOutline,
			arrowUndoOutline,
			eyeOutline,
			eyeOffOutline,
			closeOutline,
		});
	}

	ionViewWillEnter(): void {
		this.route.params
			.pipe(untilDestroyed(this, "ionViewWillLeave"))
			.subscribe((params) => this.loadEvent(parseInt(params.event)));
	}

	ionViewWillLeave(): void {}

	async updateEvent(data: Partial<SDK.EventUpdateBody>) {
		if (!this.event()) return;

		try {
			this.event.set({ ...this.event()!, ...data });
			await this.api.EventsApi.updateEvent(this.event()!.id, data);
			this.toastService.toast("Uloženo.");
		} catch (e) {
			this.toastService.toast("Nepodařilo se uložit změny.", { color: "warning" });
		}

		await this.loadEvent(this.event()!.id);
	}

	private async loadEvent(eventId: number) {
		const event = await this.api.EventsApi.getEvent(eventId).then((res) => res.data);
		this.event.set(event);

		this.setActions(this.event()!);
	}

	async reloadEvent() {
		await this.loadEvent(this.event()!.id);
	}

	async leadEvent(event: SDK.EventResponseWithLinks) {
		await this.api.EventsApi.leadEvent(event.id);

		await this.loadEvent(event.id);

		this.toastService.toast("Uloženo");
	}

	private async eventStatusAction(event: SDK.EventResponseWithLinks, action: EventStatusActions) {
		if (!event._links[action].allowed) {
			this.toastService.toast("K této akci nemáš oprávnění.");
			return;
		}

		const statusNote = window.prompt("Poznámka ke změně stavu (můžeš nechat prázdné):");
		if (statusNote === null) return;

		await this.api.EventsApi[action](event.id, { statusNote });

		await this.loadEvent(event.id);

		this.toastService.toast("Uloženo");
	}

	private async deleteEvent(event: SDK.EventResponseWithLinks) {
		const confirmation = await this.modalService.deleteConfirmationModal(
			`Opravdu chcete smazat akci ${event.name}?`,
		);

		if (confirmation) {
			await this.api.EventsApi.deleteEvent(event.id);
			this.router.navigate(["/akce"], { relativeTo: this.route, replaceUrl: true });
			this.toastService.toast("Akce smazána");
		}
	}

	private async restoreEvent(event: SDK.EventResponseWithLinks) {
		await this.api.EventsApi.restoreEvent(event.id);
		await this.loadEvent(event.id);
		this.toastService.toast("Akce obnovena");
	}

	private setActions(event: SDK.EventResponseWithLinks) {
		this.actions = [
			{
				text: "Vést akci",
				color: "success",
				icon: handLeftOutline,
				hidden: !event._links.leadEvent.applicable,
				disabled: !event._links.leadEvent.allowed,
				handler: () => this.leadEvent(event),
			},
			{
				text: "Ke schválení",
				icon: arrowForwardOutline,
				color: "primary",
				hidden: !event._links.submitEvent.applicable,
				disabled: !event._links.submitEvent.allowed,
				handler: () => this.eventStatusAction(event, "submitEvent"),
			},
			{
				text: "Do programu",
				icon: eyeOutline,
				color: "primary",
				hidden: !event._links.publishEvent.applicable,
				disabled: !event._links.publishEvent.allowed,
				handler: () => this.eventStatusAction(event, "publishEvent"),
			},
			{
				text: "Vrátit k úpravám",
				icon: arrowBackOutline,
				color: "danger",
				hidden: !event._links.rejectEvent.applicable,
				disabled: !event._links.rejectEvent.allowed,
				handler: () => this.eventStatusAction(event, "rejectEvent"),
			},
			{
				text: "Odebrat z programu",
				icon: eyeOffOutline,
				color: "danger",
				hidden: !event._links.unpublishEvent.applicable,
				disabled: !event._links.unpublishEvent.allowed,
				handler: () => this.eventStatusAction(event, "unpublishEvent"),
			},
			{
				text: "Označit jako zrušenou",
				color: "danger",
				icon: closeOutline,
				hidden: !event._links.cancelEvent.applicable,
				disabled: !event._links.cancelEvent.allowed,
				handler: () => this.eventStatusAction(event, "cancelEvent"),
			},
			{
				text: "Odzrušit",
				icon: arrowUndoOutline,
				hidden: !event._links.uncancelEvent.applicable,
				disabled: !event._links.uncancelEvent.allowed,
				handler: () => this.eventStatusAction(event, "uncancelEvent"),
			},
			{
				text: "Smazat",
				role: "destructive",
				color: "danger",
				icon: "trash-outline",
				hidden: !event._links.deleteEvent.applicable,
				disabled: !event._links.deleteEvent.allowed,
				handler: () => this.deleteEvent(event),
			},
			{
				text: "Obnovit",
				role: "destructive",
				color: "success",
				icon: "arrow-undo-outline",
				hidden: !event._links.restoreEvent.applicable,
				disabled: !event._links.restoreEvent.allowed,
				handler: () => this.restoreEvent(event),
			},
		];
	}
}
