import { Component } from "@angular/core";
import { ModalController } from "@ionic/angular/standalone";
import { InputModalComponent } from "src/app/core/services/modal.service";
import { ModalLayoutComponent } from "src/app/shared/components/modal-layout/modal-layout.component";

@Component({
	selector: "bo-album-publish-modal",
	templateUrl: "./album-publish-modal.component.html",
	styleUrl: "./album-publish-modal.component.scss",
	imports: [ModalLayoutComponent],
})
export class AlbumPublishModalComponent extends InputModalComponent<boolean> {
	albumName!: string;

	constructor(modalController: ModalController) {
		super(modalController);
	}
}
