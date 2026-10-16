import { Component, computed, input } from "@angular/core";
import { IonIcon } from "@ionic/angular/standalone";
import { addIcons } from "ionicons";
import { alertCircleOutline, cloudUploadOutline } from "ionicons/icons";
import { ModalService } from "src/app/core/services/modal.service";
import { PhotoUploadService } from "src/app/core/services/photo-upload.service";

@Component({
	selector: "bo-photo-upload-indicator",
	templateUrl: "./photo-upload-indicator.component.html",
	styleUrl: "./photo-upload-indicator.component.scss",
	imports: [IonIcon],
	host: {
		"[class.compact]": "compact()",
	},
})
export class PhotoUploadIndicatorComponent {
	compact = input(false);

	visible = computed(() => this.photoUploadService.batch().length > 0);

	uploading = this.photoUploadService.uploading;

	errorCount = this.photoUploadService.errorCount;

	total = computed(() => this.photoUploadService.batch().length);

	number = computed(() => Math.min(this.photoUploadService.finishedCount() + 1, this.total()));

	progress = this.photoUploadService.totalProgress;

	title = computed(() => {
		const album = this.photoUploadService.currentAlbum();
		if (this.uploading()) return `Nahrávám fotky do alba ${album?.name ?? ""} (${this.progress()} %)`;
		return `Některé fotky se do alba ${album?.name ?? ""} nenahrály`;
	});

	constructor(
		private photoUploadService: PhotoUploadService,
		private modalService: ModalService,
	) {
		addIcons({ alertCircleOutline, cloudUploadOutline });
	}

	async open() {
		const album = this.photoUploadService.currentAlbum();
		if (!album || this.photoUploadService.openAlbumId() !== null) return;

		const { PhotosUploadComponent } =
			await import("src/app/features/albums/components/photos-upload/photos-upload.component");
		await this.modalService.componentModal(
			PhotosUploadComponent,
			{ album },
			{ backdropDismiss: false, cssClass: "dialog-upload" },
		);
	}
}
