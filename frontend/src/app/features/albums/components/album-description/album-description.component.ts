import { DatePipe } from "@angular/common";
import { Component, computed, input, output, signal } from "@angular/core";
import { IonButton, IonIcon, IonSkeletonText } from "@ionic/angular/standalone";
import { addIcons } from "ionicons";
import { cloudUploadOutline, createOutline, documentTextOutline, trashOutline } from "ionicons/icons";
import { ApiService } from "src/app/core/services/api.service";
import { ModalService } from "src/app/core/services/modal.service";
import { ToastService } from "src/app/core/services/toast.service";
import { MarkdownEditorModalComponent } from "src/app/shared/components/markdown-editor-modal/markdown-editor-modal.component";
import { TooltipDirective } from "src/app/shared/directives/tooltip.directive";
import { MarkdownPipe } from "src/app/shared/pipes/markdown.pipe";
import { PrettyBytesPipe } from "src/app/shared/pipes/pretty-bytes.pipe";
import { openPdf } from "src/helpers/open-pdf";
import { SDK } from "src/sdk";

const CHRONICLE_MAX_SIZE = 50 * 1024 * 1024;

@Component({
	selector: "bo-album-description",
	templateUrl: "./album-description.component.html",
	styleUrl: "./album-description.component.scss",
	imports: [IonButton, IonIcon, IonSkeletonText, DatePipe, MarkdownPipe, PrettyBytesPipe, TooltipDirective],
})
export class AlbumDescriptionComponent {
	album = input<SDK.AlbumResponseWithLinks | undefined>(undefined);
	update = output<SDK.AlbumUpdateBody>();
	change = output<void>();

	readonly noPermissionText = "K tomuto albu nemáš oprávnění.";

	uploading = signal(false);
	deleting = signal(false);
	busy = computed(() => this.uploading() || this.deleting());

	canEdit = computed(() => this.album()?._links?.updateAlbum?.allowed ?? false);

	canUploadChronicle = computed(() => this.album()?._links?.uploadAlbumChronicle?.allowed ?? false);

	empty = computed(() => {
		const album = this.album();
		return !!album && !album.description && !album.chronicleFileName && !this.uploading();
	});

	constructor(
		private readonly api: ApiService,
		private readonly modalService: ModalService,
		private readonly toastService: ToastService,
	) {
		addIcons({ cloudUploadOutline, createOutline, documentTextOutline, trashOutline });
	}

	async editDescription() {
		if (!this.canEdit()) return;

		const result = await this.modalService.componentModal(MarkdownEditorModalComponent, {
			header: "Popisek",
			placeholder: "Jak akce proběhla…",
			value: this.album()?.description ?? "",
		});

		if (result !== null && result !== undefined) this.update.emit({ description: result || null });
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
