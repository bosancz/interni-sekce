import { DatePipe } from "@angular/common";
import { Component, computed, input, output, signal } from "@angular/core";
import { RouterLink } from "@angular/router";
import { IonButton, IonIcon, IonList } from "@ionic/angular/standalone";
import { addIcons } from "ionicons";
import { calendarOutline, closeOutline, cloudUploadOutline, textOutline, trashOutline } from "ionicons/icons";
import { ApiService } from "src/app/core/services/api.service";
import { ModalService } from "src/app/core/services/modal.service";
import { ToastService } from "src/app/core/services/toast.service";
import { PrettyBytesPipe } from "src/app/shared/pipes/pretty-bytes.pipe";
import { openPdf } from "src/helpers/open-pdf";
import { EditButtonDateRangeComponent } from "src/app/shared/components/edit-button-date-range/edit-button-date-range.component";
import { EditButtonMarkdownComponent } from "src/app/shared/components/edit-button-markdown/edit-button-markdown.component";
import { EditButtonTextComponent } from "src/app/shared/components/edit-button-text/edit-button-text.component";
import { ItemComponent } from "src/app/shared/components/item/item.component";
import { TooltipDirective } from "src/app/shared/directives/tooltip.directive";
import { DateRangePipe } from "src/app/shared/pipes/date-range.pipe";
import { MarkdownPipe } from "src/app/shared/pipes/markdown.pipe";
import { SDK } from "src/sdk";
import { EditButtonEventComponent } from "../edit-button-event/edit-button-event.component";

const CHRONICLE_MAX_SIZE = 50 * 1024 * 1024;

@Component({
	selector: "bo-album-info",
	templateUrl: "./album-info.component.html",
	styleUrl: "./album-info.component.scss",

	imports: [
		IonList,
		IonButton,
		IonIcon,
		DatePipe,
		DateRangePipe,
		ItemComponent,
		EditButtonEventComponent,
		EditButtonDateRangeComponent,
		EditButtonTextComponent,
		EditButtonMarkdownComponent,
		MarkdownPipe,
		PrettyBytesPipe,
		TooltipDirective,
		RouterLink,
	],
})
export class AlbumInfoComponent {
	album = input<SDK.AlbumResponseWithLinks | undefined>(undefined);
	update = output<SDK.AlbumUpdateBody>();
	change = output<void>();

	uploading = signal(false);
	deleting = signal(false);
	busy = computed(() => this.uploading() || this.deleting());

	constructor(
		private readonly api: ApiService,
		private readonly modalService: ModalService,
		private readonly toastService: ToastService,
	) {
		addIcons({ calendarOutline, textOutline, closeOutline, cloudUploadOutline, trashOutline });
	}

	async uploadChronicle(input: HTMLInputElement) {
		const album = this.album();
		const file = input.files?.[0];
		input.value = "";
		if (!album || !file) return;

		if (file.type !== "application/pdf" && !/\.pdf$/i.test(file.name)) {
			this.toastService.toast("Kronika musí být PDF.", { color: "warning" });
			return;
		}

		if (file.size > CHRONICLE_MAX_SIZE) {
			this.toastService.toast("Kronika může mít nejvýš 50 MB.", { color: "warning" });
			return;
		}

		this.uploading.set(true);
		try {
			await this.api.PhotoGalleryApi.uploadAlbumChronicle(album.id, file);
			this.toastService.toast("Kronika nahrána.");
			this.change.emit();
		} catch (e) {
			this.toastService.toast("Nepodařilo se nahrát kroniku.", { color: "warning" });
		} finally {
			this.uploading.set(false);
		}
	}

	async openChronicle(event: Event) {
		event.preventDefault();
		const album = this.album();
		if (!album) return;

		const response = await this.api.PhotoGalleryApi.getAlbumChronicle(album.id, { responseType: "blob" }).catch(
			() => null,
		);
		if (!response) {
			this.toastService.toast("Nepodařilo se otevřít kroniku.", { color: "warning" });
			return;
		}

		openPdf(response.data as unknown as Blob);
	}

	async deleteChronicle() {
		const album = this.album();
		if (!album || this.busy()) return;

		const confirmed = await this.modalService.deleteConfirmationModal(
			`Opravdu chceš odebrat kroniku „${album.chronicleFileName}“? Z webu zmizí i u publikované fotogalerie.`,
			{ header: "Odebrat kroniku?", buttonText: "Odebrat" },
		);
		if (!confirmed) return;

		this.deleting.set(true);
		try {
			await this.api.PhotoGalleryApi.deleteAlbumChronicle(album.id);
			this.toastService.toast("Kronika odebrána.");
			this.change.emit();
		} catch (e) {
			this.toastService.toast("Nepodařilo se odebrat kroniku.", { color: "warning" });
		} finally {
			this.deleting.set(false);
		}
	}
}
