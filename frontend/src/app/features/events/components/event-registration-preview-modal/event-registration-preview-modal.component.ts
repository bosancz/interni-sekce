import { Component } from "@angular/core";
import { SafeResourceUrl } from "@angular/platform-browser";
import { IonIcon, ModalController } from "@ionic/angular/standalone";
import { addIcons } from "ionicons";
import { openOutline } from "ionicons/icons";
import { InputModalComponent } from "src/app/core/services/modal.service";
import { ModalLayoutComponent } from "src/app/shared/components/modal-layout/modal-layout.component";

@Component({
	selector: "bo-event-registration-preview-modal",
	templateUrl: "./event-registration-preview-modal.component.html",
	styleUrl: "./event-registration-preview-modal.component.scss",
	imports: [IonIcon, ModalLayoutComponent],
})
export class EventRegistrationPreviewModalComponent extends InputModalComponent<boolean> {
	src!: SafeResourceUrl;
	url!: string;

	constructor(modalController: ModalController) {
		super(modalController);
		addIcons({ openOutline });
	}

	publish() {
		this.submit.emit(true);
	}

	openInNewTab() {
		window.open(this.url, "_blank", "noopener");
	}
}
