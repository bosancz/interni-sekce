import { Component } from "@angular/core";
import { IonIcon, ModalController } from "@ionic/angular/standalone";
import { addIcons } from "ionicons";
import { closeOutline } from "ionicons/icons";
import { InputModalComponent } from "src/app/core/services/modal.service";
import { ModalLayoutComponent } from "src/app/shared/components/modal-layout/modal-layout.component";
import { SDK } from "src/sdk";
import { FaceReviewComponent } from "../face-review/face-review.component";

@Component({
	selector: "bo-album-face-review-modal",
	templateUrl: "./album-face-review-modal.component.html",
	styleUrl: "./album-face-review-modal.component.scss",
	imports: [IonIcon, ModalLayoutComponent, FaceReviewComponent],
})
export class AlbumFaceReviewModalComponent extends InputModalComponent<void> {
	album!: SDK.AlbumResponseWithLinks;

	constructor(modalController: ModalController) {
		super(modalController);
		addIcons({ closeOutline });
	}
}
