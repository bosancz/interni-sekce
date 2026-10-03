import { DatePipe } from "@angular/common";
import { Component, computed, effect, signal } from "@angular/core";
import { RouterLink } from "@angular/router";
import { IonIcon, IonSkeletonText } from "@ionic/angular/standalone";
import { addIcons } from "ionicons";
import { imagesOutline } from "ionicons/icons";
import { ApiService } from "src/app/core/services/api.service";
import { ModalService } from "src/app/core/services/modal.service";
import { PhotosEditComponent } from "src/app/features/albums/components/photos-edit/photos-edit.component";
import { CardContentComponent } from "src/app/shared/components/card-content/card-content.component";
import { CardHeaderComponent } from "src/app/shared/components/card-header/card-header.component";
import { CardOpenButtonComponent } from "src/app/shared/components/card-open-button/card-open-button.component";
import { CardTitleComponent } from "src/app/shared/components/card-title/card-title.component";
import { CardComponent } from "src/app/shared/components/card/card.component";
import { PhotoImageUrlPipe } from "src/app/shared/pipes/photo-image-url.pipe";
import { SDK } from "src/sdk";

@Component({
	selector: "bo-home-card-photo-of-day",
	templateUrl: "./home-card-photo-of-day.component.html",
	styleUrls: ["./home-card-photo-of-day.component.scss"],

	imports: [
		DatePipe,
		RouterLink,
		IonIcon,
		IonSkeletonText,
		CardComponent,
		CardHeaderComponent,
		CardTitleComponent,
		CardOpenButtonComponent,
		CardContentComponent,
		PhotoImageUrlPipe,
	],
})
export class HomeCardPhotoOfDayComponent {
	daily = signal<SDK.PhotoDailyResponse | undefined>(undefined);

	canSeePhoto = computed(() => this.api.links()?.getDailyPhoto?.allowed ?? false);

	constructor(
		private api: ApiService,
		private modalService: ModalService,
	) {
		addIcons({ imagesOutline });

		effect(() => {
			if (this.canSeePhoto() && this.daily() === undefined) this.loadPhoto();
		});
	}

	async loadPhoto() {
		const daily = await this.api.PhotoGalleryApi.getDailyPhoto().then((res) => res.data);
		this.daily.set(daily);
	}

	async openPhoto(photo: SDK.PhotoResponseWithLinks) {
		await this.modalService.modal(
			PhotosEditComponent,
			{ photos: [photo], startPhoto: photo },
			{ backdropDismiss: false, cssClass: "ion-modal-lg" },
		);
	}
}
