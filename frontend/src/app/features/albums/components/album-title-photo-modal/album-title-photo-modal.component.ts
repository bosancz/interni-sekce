import { Component } from "@angular/core";
import { IonIcon, ModalController } from "@ionic/angular/standalone";
import { addIcons } from "ionicons";
import { closeOutline, star } from "ionicons/icons";
import { InputModalComponent } from "src/app/core/services/modal.service";
import { ModalLayoutComponent } from "src/app/shared/components/modal-layout/modal-layout.component";
import { PhotoImageUrlPipe } from "src/app/shared/pipes/photo-image-url.pipe";
import { SDK } from "src/sdk";

@Component({
	selector: "bo-album-title-photo-modal",
	templateUrl: "./album-title-photo-modal.component.html",
	styleUrl: "./album-title-photo-modal.component.scss",
	imports: [IonIcon, ModalLayoutComponent, PhotoImageUrlPipe],
})
export class AlbumTitlePhotoModalComponent extends InputModalComponent<SDK.PhotoResponseWithLinks> {
	photos: SDK.PhotoResponseWithLinks[] = [];

	selectedId?: number;

	constructor(modalController: ModalController) {
		super(modalController);
		addIcons({ closeOutline, star });
	}
}
