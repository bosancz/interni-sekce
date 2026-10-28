import { CommonModule } from "@angular/common";
import { Component, computed, effect, input, output, signal } from "@angular/core";
import { RouterLink } from "@angular/router";
import { IonButton, IonIcon, IonItem, IonLabel, IonSkeletonText } from "@ionic/angular/standalone";
import { UntilDestroy } from "@ngneat/until-destroy";
import { addIcons } from "ionicons";
import {
	checkmarkCircleOutline,
	chevronForwardOutline,
	closeOutline,
	cloudUploadOutline,
	documentAttachOutline,
	documentTextOutline,
	globeOutline,
	imagesOutline,
	lockClosedOutline,
	sendOutline,
	trashOutline,
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
import { openPdf } from "src/helpers/open-pdf";
import { SDK } from "src/sdk";
import { PrettyBytesPipe } from "src/app/shared/pipes/pretty-bytes.pipe";
import { MarkdownPipe } from "../../../../shared/pipes/markdown.pipe";
import { AlbumPublishModalComponent } from "../album-publish-modal/album-publish-modal.component";
import { AlbumSelectorModalComponent, CREATE_ALBUM } from "../album-selector-modal/album-selector-modal.component";
import { RiverSelectModalComponent } from "../river-select-modal/river-select-modal.component";

const CHRONICLE_MAX_SIZE = 50 * 1024 * 1024;

const REVIZOR_REPORT_TEMPLATE = "**Komplikace:**\n\n**Pochvaly:**\n\n**Stížnosti:**\n";

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
		PrettyBytesPipe,
		IonButton,
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

	report = signal<string | null>(null);

	canReadReport = computed(() => this.event()?._links?.getEventReport?.allowed ?? false);
	canEditReport = computed(() => this.event()?._links?.updateEventReport?.allowed ?? false);
	canEditAlbum = computed(() => this.event()?._links?.updateEvent?.allowed ?? false);
	publishBlockedText = computed(() => {
		const event = this.event();
		if (!event?._links?.publishEventReport?.allowed) return this.noPermissionText;
		if (!event.publicReport?.trim() && !event.chronicleFileName)
			return "Nejdřív napiš shrnutí akce nebo nahraj kroniku v PDF.";
		const report = this.report()?.trim();
		if (!report || report === REVIZOR_REPORT_TEMPLATE.trim()) return "Nejdřív vyplň report pro revizora.";
		return null;
	});

	canPublish = computed(() => this.publishBlockedText() === null);

	publishing = signal(false);

	uploadingChronicle = signal(false);
	deletingChronicle = signal(false);
	chronicleBusy = computed(() => this.uploadingChronicle() || this.deletingChronicle());

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
			cloudUploadOutline,
			documentAttachOutline,
			trashOutline,
		});

		effect(() => {
			const event = this.event();
			if (event && this.canReadReport()) this.loadReport(event.id);
			else this.report.set(null);
		});
	}

	private async loadReport(eventId: number) {
		const report = await this.api.EventsApi.getEventReport(eventId)
			.then((res) => res.data.report)
			.catch(() => null);
		if (this.event()?.id === eventId) this.report.set(report);
	}

	async writePublicReport() {
		const result = await this.modalService.componentModal(MarkdownEditorModalComponent, {
			header: "Shrnutí akce na web",
			value: this.event()?.publicReport ?? "",
		});

		if (result !== null) await this.saveReportData({ publicReport: result });
	}

	async writeReport() {
		const result = await this.modalService.componentModal(MarkdownEditorModalComponent, {
			header: "Report pro revizora",
			value: this.report() || REVIZOR_REPORT_TEMPLATE,
		});

		if (result !== null) await this.saveReportData({ report: result });
	}

	async publish() {
		const event = this.event();
		if (!event || !this.canPublish() || this.publishing()) return;

		this.publishing.set(true);
		try {
			await this.api.EventsApi.publishEventReport(event.id);
			this.toastService.toast("Report odeslán.");
			this.change.emit();
		} catch (e) {
			this.toastService.toast("Nepodařilo se odeslat report.", { color: "warning" });
			return;
		} finally {
			this.publishing.set(false);
		}

		if (event.album) await this.offerAlbumPublish(event.album.id);
	}

	private async offerAlbumPublish(albumId: number) {
		const album = await this.api.PhotoGalleryApi.getAlbum(albumId)
			.then((res) => res.data)
			.catch(() => null);
		if (album?.status !== "draft" || !album._links.publishAlbum.allowed) return;

		const confirmed = await this.modalService.componentModal(
			AlbumPublishModalComponent,
			{ albumName: album.name },
			{ cssClass: "dialog-brand" },
		);
		if (!confirmed) return;

		try {
			await this.api.PhotoGalleryApi.publishAlbum(album.id);
			this.toastService.toast("Fotogalerie publikována.");
			this.change.emit();
		} catch (e) {
			this.toastService.toast("Nepodařilo se publikovat fotogalerii.", { color: "warning" });
		}
	}

	async unpublish() {
		const event = this.event();
		if (!event || this.publishing()) return;

		const confirmed = await this.modalService.confirmationModal(
			"Shrnutí zmizí z Aktualit na bosan.cz, dokud report znovu nepublikuješ.",
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
			await this.api.EventsApi.updateEventReport(event.id, data);
			this.toastService.toast("Uloženo.");
			this.change.emit();
		} catch (e) {
			this.toastService.toast("Nepodařilo se uložit report.", { color: "warning" });
		}
	}

	async uploadChronicle(input: HTMLInputElement) {
		const event = this.event();
		const file = input.files?.[0];
		input.value = "";
		if (!event || !file) return;

		if (file.type !== "application/pdf" && !/\.pdf$/i.test(file.name)) {
			this.toastService.toast("Kronika musí být PDF.", { color: "warning" });
			return;
		}

		if (file.size > CHRONICLE_MAX_SIZE) {
			this.toastService.toast("Kronika může mít nejvýš 50 MB.", { color: "warning" });
			return;
		}

		this.uploadingChronicle.set(true);
		try {
			await this.api.EventsApi.uploadEventReportChronicle(event.id, file);
			this.toastService.toast("Kronika nahrána.");
			this.change.emit();
		} catch (e) {
			this.toastService.toast("Nepodařilo se nahrát kroniku.", { color: "warning" });
		} finally {
			this.uploadingChronicle.set(false);
		}
	}

	async openChronicle() {
		const event = this.event();
		if (!event) return;

		const response = await this.api.EventsApi.getEventReportChronicle(event.id, { responseType: "blob" }).catch(
			() => null,
		);
		if (!response) {
			this.toastService.toast("Nepodařilo se otevřít kroniku.", { color: "warning" });
			return;
		}

		openPdf(response.data as unknown as Blob);
	}

	async deleteChronicle() {
		const event = this.event();
		if (!event || this.chronicleBusy()) return;

		const confirmed = await this.modalService.deleteConfirmationModal(
			event.publicReport?.trim()
				? `Opravdu chceš odebrat kroniku „${event.chronicleFileName}“? Z webu zmizí i u publikovaného shrnutí.`
				: `Opravdu chceš odebrat kroniku „${event.chronicleFileName}“? Bez textového shrnutí se tím zruší i publikování reportu.`,
			{ header: "Odebrat kroniku?", buttonText: "Odebrat" },
		);
		if (!confirmed) return;

		this.deletingChronicle.set(true);
		try {
			await this.api.EventsApi.deleteEventReportChronicle(event.id);
			this.toastService.toast("Kronika odebrána.");
			this.change.emit();
		} catch (e) {
			this.toastService.toast("Nepodařilo se odebrat kroniku.", { color: "warning" });
		} finally {
			this.deletingChronicle.set(false);
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
