import { CommonModule } from "@angular/common";
import { Component, computed, input, output, signal } from "@angular/core";
import { RouterLink } from "@angular/router";
import { IonButton, IonIcon, IonItem, IonLabel, IonSkeletonText } from "@ionic/angular/standalone";
import { UntilDestroy } from "@ngneat/until-destroy";
import { addIcons } from "ionicons";
import { chevronForwardOutline, closeOutline, documentTextOutline, imagesOutline } from "ionicons/icons";
import { ApiService } from "src/app/core/services/api.service";
import { ModalService } from "src/app/core/services/modal.service";
import { ToastService } from "src/app/core/services/toast.service";
import { EditButtonMarkdownComponent } from "src/app/shared/components/edit-button-markdown/edit-button-markdown.component";
import { MarkdownEditorModalComponent } from "src/app/shared/components/markdown-editor-modal/markdown-editor-modal.component";
import { TooltipDirective } from "src/app/shared/directives/tooltip.directive";
import { SDK } from "src/sdk";
import { MarkdownPipe } from "../../../../shared/pipes/markdown.pipe";
import { AlbumSelectorModalComponent, CREATE_ALBUM } from "../album-selector-modal/album-selector-modal.component";

const EVENT_REPORT_TEMPLATE = ["# Průběh akce", "", "# Problémy", "", "# Pochvaly pro členy"].join("\n");

@UntilDestroy()
@Component({
	selector: "bo-event-report",
	templateUrl: "./event-report.component.html",
	styleUrls: ["./event-report.component.scss"],

	imports: [
		CommonModule,
		RouterLink,
		EditButtonMarkdownComponent,
		MarkdownPipe,
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

	canEditReport = computed(() => this.event()?._links?.updateEventReport?.allowed ?? false);
	canEditAlbum = computed(() => this.event()?._links?.updateEvent?.allowed ?? false);

	addingAlbum = signal(false);
	removingAlbum = signal(false);

	constructor(
		private readonly api: ApiService,
		private readonly toastService: ToastService,
		private readonly modalService: ModalService,
	) {
		addIcons({ imagesOutline, chevronForwardOutline, documentTextOutline, closeOutline });
	}

	async writeReport() {
		const result = await this.modalService.componentModal(MarkdownEditorModalComponent, {
			header: "Report",
			value: this.event()?.report || EVENT_REPORT_TEMPLATE,
		});

		if (result !== null) await this.saveReport(result);
	}

	async saveReport(report: string | null) {
		const event = this.event();
		if (!event) return;

		try {
			await this.api.EventsApi.updateEventReport(event.id, { report });
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
