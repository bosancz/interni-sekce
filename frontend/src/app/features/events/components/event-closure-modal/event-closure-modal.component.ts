import { DatePipe } from "@angular/common";
import { Component, computed, OnInit, signal } from "@angular/core";
import { IonIcon, ModalController } from "@ionic/angular/standalone";
import { addIcons } from "ionicons";
import { checkmarkOutline, chevronForwardOutline } from "ionicons/icons";
import { ApiService } from "src/app/core/services/api.service";
import { InputModalComponent } from "src/app/core/services/modal.service";
import { ModalLayoutComponent } from "src/app/shared/components/modal-layout/modal-layout.component";
import { SDK } from "src/sdk";

export type EventClosureItem = "accounting" | "report" | "gallery";

@Component({
	selector: "bo-event-closure-modal",
	templateUrl: "./event-closure-modal.component.html",
	styleUrl: "./event-closure-modal.component.scss",
	imports: [DatePipe, IonIcon, ModalLayoutComponent],
})
export class EventClosureModalComponent extends InputModalComponent<EventClosureItem> implements OnInit {
	event!: SDK.EventResponseWithLinks;

	titlePhotoMissing = signal(false);

	galleryPublished = computed(() => this.event.album?.status === "public");

	constructor(
		modalController: ModalController,
		private readonly api: ApiService,
	) {
		super(modalController);
		addIcons({ checkmarkOutline, chevronForwardOutline });
	}

	ngOnInit(): void {
		const albumId = this.event.album?.id;
		if (!albumId) return;

		this.api.PhotoGalleryApi.getAlbumPhotos(albumId)
			.then((res) =>
				this.titlePhotoMissing.set(res.data.length > 0 && !res.data.some((photo) => photo.titlePhoto)),
			)
			.catch(() => undefined);
	}
}
