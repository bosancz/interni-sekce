import { DatePipe } from "@angular/common";
import { Component, signal } from "@angular/core";
import { AlertController, ViewWillEnter } from "@ionic/angular/standalone";
import { addIcons } from "ionicons";
import { arrowUndoOutline, trashOutline } from "ionicons/icons";
import { ApiService } from "src/app/core/services/api.service";
import { ToastService } from "src/app/core/services/toast.service";
import { Action } from "src/app/shared/components/action-buttons/action-buttons.component";
import { AdminTableCellDirective } from "src/app/shared/components/admin-table/admin-table-cell.directive";
import { AdminTableColumnComponent } from "src/app/shared/components/admin-table/admin-table-column.component";
import { AdminTableComponent } from "src/app/shared/components/admin-table/admin-table.component";
import { EventStatusBadgeComponent } from "src/app/shared/components/event-status-badge/event-status-badge.component";
import { PageContentComponent } from "src/app/shared/components/page-content/page-content.component";
import { PageHeaderComponent } from "src/app/shared/components/page-header/page-header.component";
import { SDK } from "src/sdk";

@Component({
	selector: "bo-deleted-events-list",
	templateUrl: "./deleted-events-list.component.html",
	styleUrls: ["./deleted-events-list.component.scss"],
	imports: [
		PageHeaderComponent,
		PageContentComponent,
		EventStatusBadgeComponent,
		AdminTableComponent,
		AdminTableColumnComponent,
		AdminTableCellDirective,
		DatePipe,
	],
})
export class DeletedEventsListComponent implements ViewWillEnter {
	events = signal<SDK.EventResponseWithLinks[] | undefined>(undefined);

	// Header shown above the actions on the mobile ActionSheet.
	rowActionsHeader = (event: SDK.EventResponseWithLinks) => event.name;

	// Arrow property (stable reference + bound `this`) so it can be passed as the
	// admin-table `[actions]` input and invoked from there per row.
	eventActions = (event: SDK.EventResponseWithLinks): Action[] => [
		{
			text: "Obnovit",
			color: "success",
			icon: arrowUndoOutline,
			hidden: !event._links.restoreEvent.allowed,
			handler: () => this.restoreEvent(event),
		},
		{
			text: "Smazat trvale",
			role: "destructive",
			color: "danger",
			icon: trashOutline,
			hidden: !event._links.deleteEventPermanent.allowed,
			handler: () => this.permanentlyDeleteEvent(event),
		},
	];

	constructor(
		private api: ApiService,
		private alertController: AlertController,
		private toastService: ToastService,
	) {
		addIcons({ arrowUndoOutline, trashOutline });
	}

	ionViewWillEnter(): void {
		this.loadEvents();
	}

	private async loadEvents() {
		const events = await this.api.EventsApi.listDeletedEvents().then((res) => res.data);
		this.events.set(events);
	}

	async restoreEvent(event: SDK.EventResponseWithLinks) {
		if (!event._links.restoreEvent.allowed) return;

		await this.api.EventsApi.restoreEvent(event.id);

		await this.loadEvents();

		await this.toastService.toast(`${event.name} obnovena.`);
	}

	async permanentlyDeleteEvent(event: SDK.EventResponseWithLinks) {
		if (!event._links.deleteEventPermanent.allowed) return;

		const alert = await this.alertController.create({
			header: `Trvale smazat ${event.name}?`,
			message: "Tuto akci nelze vzít zpět.",
			buttons: [
				{ text: "Zrušit", role: "cancel" },
				{
					text: "Smazat trvale",
					role: "destructive",
					handler: async () => this.permanentlyDeleteEventConfirmed(event),
				},
			],
		});

		alert.present();
	}

	private async permanentlyDeleteEventConfirmed(event: SDK.EventResponseWithLinks) {
		try {
			await this.api.EventsApi.deleteEventPermanent(event.id);
		} catch (err: any) {
			const message = err?.response?.data?.message ?? "Akci se nepodařilo trvale smazat.";
			await this.toastService.toast(message, { color: "danger", duration: 4000 });
			return;
		}

		await this.loadEvents();

		await this.toastService.toast(`${event.name} trvale smazána.`);
	}
}
