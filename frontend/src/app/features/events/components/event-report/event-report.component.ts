import { CommonModule } from "@angular/common";
import { Component, computed, effect, input, output, signal } from "@angular/core";
import { RouterLink } from "@angular/router";
import { IonButton, IonCheckbox, IonIcon, IonItem, IonLabel, IonSkeletonText } from "@ionic/angular/standalone";
import { UntilDestroy } from "@ngneat/until-destroy";
import { addIcons } from "ionicons";
import {
	checkmarkCircleOutline,
	chevronForwardOutline,
	closeOutline,
	documentTextOutline,
	globeOutline,
	imagesOutline,
	lockClosedOutline,
	sendOutline,
} from "ionicons/icons";
import { ApiService } from "src/app/core/services/api.service";
import { ModalService } from "src/app/core/services/modal.service";
import { ToastService } from "src/app/core/services/toast.service";
import { CardContentComponent } from "src/app/shared/components/card-content/card-content.component";
import { CardHeaderComponent } from "src/app/shared/components/card-header/card-header.component";
import { CardTitleComponent } from "src/app/shared/components/card-title/card-title.component";
import { CardComponent } from "src/app/shared/components/card/card.component";
import { EditButtonComponent } from "src/app/shared/components/edit-button/edit-button.component";
import { EditButtonMarkdownComponent } from "src/app/shared/components/edit-button-markdown/edit-button-markdown.component";
import { EditButtonNumberComponent } from "src/app/shared/components/edit-button-number/edit-button-number.component";
import { MarkdownEditorModalComponent } from "src/app/shared/components/markdown-editor-modal/markdown-editor-modal.component";
import { TooltipDirective } from "src/app/shared/directives/tooltip.directive";
import { SDK } from "src/sdk";
import { MarkdownPipe } from "../../../../shared/pipes/markdown.pipe";
import { AlbumSelectorModalComponent, CREATE_ALBUM } from "../album-selector-modal/album-selector-modal.component";
import { RiverSelectModalComponent } from "../river-select-modal/river-select-modal.component";

@UntilDestroy()
@Component({
	selector: "bo-event-report",
	templateUrl: "./event-report.component.html",
	styleUrls: ["./event-report.component.scss"],

	imports: [
		CommonModule,
		RouterLink,
		CardComponent,
		CardContentComponent,
		CardHeaderComponent,
		CardTitleComponent,
		EditButtonComponent,
		EditButtonMarkdownComponent,
		EditButtonNumberComponent,
		MarkdownPipe,
		IonButton,
		IonCheckbox,
		IonIcon,
		IonItem,
		IonLabel,
		IonSkeletonText,
		TooltipDirective,
	],
})
export class EventReportComponent {
	event = input<SDK.EventResponseWithLinks | undefined>();
	change = output<void>();

	readonly noPermissionText = "K této akci nemáš oprávnění.";

	canEditReport = computed(() => this.event()?._links?.updateEventReport?.allowed ?? false);
	canEditAlbum = computed(() => this.event()?._links?.updateEvent?.allowed ?? false);
	canReadRevizorReport = computed(() => this.event()?._links?.getEventReport?.allowed ?? false);

	readonly revizorFields: { key: keyof SDK.EventReportResponse; label: string; placeholder: string }[] = [
		{ key: "reportComplications", label: "Komplikace", placeholder: "Co se nepovedlo, úrazy, problémy…" },
		{ key: "reportPraises", label: "Pochvaly", placeholder: "Kdo nebo co si zaslouží pochvalu…" },
		{ key: "reportComplaints", label: "Stížnosti", placeholder: "Stížnosti rodičů, dětí nebo okolí…" },
	];

	revizorReport = signal<SDK.EventReportResponse | null>(null);

	missingRevizorFields = computed(() => {
		const report = this.revizorReport();
		return this.revizorFields.filter((field) => !report || report[field.key] === null);
	});

	publishBlockedText = computed(() => {
		if (!this.event()?._links?.publishEventReport?.allowed) return this.noPermissionText;
		if (!this.event()?.report?.trim()) return "Nejdřív napiš shrnutí akce.";
		const missing = this.missingRevizorFields();
		if (missing.length)
			return `Vyplň nebo zaškrtni „Žádné“: ${missing.map((field) => field.label.toLowerCase()).join(", ")}.`;
		return null;
	});

	canPublish = computed(() => this.publishBlockedText() === null);

	publishing = signal(false);

	addingAlbum = signal(false);
	removingAlbum = signal(false);

	constructor(
		private readonly api: ApiService,
		private readonly toastService: ToastService,
		private readonly modalService: ModalService,
	) {
		addIcons({
			imagesOutline,
			chevronForwardOutline,
			documentTextOutline,
			closeOutline,
			globeOutline,
			lockClosedOutline,
			sendOutline,
			checkmarkCircleOutline,
		});

		effect(() => {
			const event = this.event();
			const allowed = this.canReadRevizorReport();
			if (event && allowed) this.loadRevizorReport(event.id);
			else this.revizorReport.set(null);
		});
	}

	async loadRevizorReport(eventId: number) {
		try {
			const report = await this.api.EventsApi.getEventReport(eventId).then((res) => res.data);
			if (this.event()?.id === eventId) this.revizorReport.set(report);
		} catch (e) {
			this.toastService.toast("Nepodařilo se načíst část reportu pro revizora.", { color: "warning" });
		}
	}

	async saveRevizorField(key: keyof SDK.EventReportResponse, value: string | null) {
		await this.saveReportData({ [key]: value?.trim() || null });
	}

	async setRevizorFieldNone(key: keyof SDK.EventReportResponse, none: boolean) {
		await this.saveReportData({ [key]: none ? "" : null });
	}

	async writeReport() {
		const result = await this.modalService.componentModal(MarkdownEditorModalComponent, {
			header: "Shrnutí akce",
			value: this.event()?.report ?? "",
		});

		if (result !== null) await this.saveReport(result);
	}

	async saveReport(report: string | null) {
		await this.saveReportData({ report });
	}

	async publish() {
		const event = this.event();
		if (!event || !this.canPublish() || this.publishing()) return;

		this.publishing.set(true);
		try {
			await this.api.EventsApi.publishEventReport(event.id);
			this.toastService.toast("Report publikován.");
			this.change.emit();
		} catch (e) {
			this.toastService.toast("Nepodařilo se publikovat report.", { color: "warning" });
		} finally {
			this.publishing.set(false);
		}
	}

	async unpublish() {
		const event = this.event();
		if (!event || this.publishing()) return;

		const confirmed = await this.modalService.confirmationModal(
			"Shrnutí zmizí z webu a revizor uvidí report až po novém publikování.",
			{ header: "Zrušit publikování?", buttonText: "Zrušit publikování" },
		);
		if (!confirmed) return;

		this.publishing.set(true);
		try {
			await this.api.EventsApi.unpublishEventReport(event.id);
			this.toastService.toast("Publikování zrušeno.");
			this.change.emit();
		} catch (e) {
			this.toastService.toast("Nepodařilo se zrušit publikování.", { color: "warning" });
		} finally {
			this.publishing.set(false);
		}
	}

	async editRiver() {
		const result = await this.modalService.componentModal(
			RiverSelectModalComponent,
			{ value: this.event()?.river ?? null },
			{ cssClass: "dialog-picker" },
		);
		if (result) await this.saveReportData({ river: result.river });
	}

	async saveReportData(data: SDK.EventReportUpdateBody) {
		const event = this.event();
		if (!event) return;

		try {
			const report = await this.api.EventsApi.updateEventReport(event.id, data).then((res) => res.data);
			this.revizorReport.set(report);
			this.toastService.toast("Uloženo.");
			this.change.emit();
		} catch (e) {
			this.toastService.toast("Nepodařilo se uložit report.", { color: "warning" });
		}
	}

	async addAlbum() {
		const event = this.event();
		if (!event || this.addingAlbum()) return;

		const result = await this.modalService.componentModal(
			AlbumSelectorModalComponent,
			{ allowCreate: true, initialSearch: event.name, createName: event.name },
			{ cssClass: "dialog-list" },
		);
		if (!result) return;

		this.addingAlbum.set(true);
		try {
			const albumId =
				result === CREATE_ALBUM
					? await this.api.PhotoGalleryApi.createAlbum({
							name: event.name,
							dateFrom: event.dateFrom,
							dateTill: event.dateTill,
						}).then((res) => res.data.id)
					: result.id;

			await this.api.PhotoGalleryApi.updateAlbum(albumId, { eventId: event.id });

			this.toastService.toast(
				result === CREATE_ALBUM ? "Album vytvořeno a připojeno k akci." : "Album připojeno k akci.",
			);
			this.change.emit();
		} catch (e) {
			this.toastService.toast(
				result === CREATE_ALBUM ? "Nepodařilo se vytvořit album." : "Nepodařilo se připojit album.",
				{ color: "warning" },
			);
		} finally {
			this.addingAlbum.set(false);
		}
	}

	async removeAlbum(album: SDK.Album, mouseEvent?: Event) {
		mouseEvent?.stopPropagation();
		mouseEvent?.preventDefault();

		if (this.removingAlbum()) return;

		const confirmed = await this.modalService.deleteConfirmationModal(
			`Opravdu chcete odpojit album „${album.name}“ od této akce? Album zůstane zachováno.`,
			{ header: "Odpojit album?", buttonText: "Odpojit" },
		);
		if (!confirmed) return;

		this.removingAlbum.set(true);
		try {
			await this.api.PhotoGalleryApi.updateAlbum(album.id, { eventId: null });
			this.toastService.toast("Album odpojeno od akce.");
			this.change.emit();
		} catch (e) {
			this.toastService.toast("Nepodařilo se odpojit album.", { color: "warning" });
		} finally {
			this.removingAlbum.set(false);
		}
	}
}
