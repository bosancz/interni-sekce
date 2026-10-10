import { DatePipe } from "@angular/common";
import { Component } from "@angular/core";
import { IonButton, IonIcon, IonProgressBar } from "@ionic/angular/standalone";
import { addIcons } from "ionicons";
import {
	checkmarkCircleOutline,
	cloudDownloadOutline,
	cloudOfflineOutline,
	refreshOutline,
	trashOutline,
} from "ionicons/icons";
import { ModalService } from "src/app/core/services/modal.service";
import { OfflineDataService } from "src/app/core/services/offline-data.service";
import { CardContentComponent } from "src/app/shared/components/card-content/card-content.component";
import { CardHeaderComponent } from "src/app/shared/components/card-header/card-header.component";
import { CardTitleComponent } from "src/app/shared/components/card-title/card-title.component";
import { CardComponent } from "src/app/shared/components/card/card.component";

@Component({
	selector: "bo-account-offline",
	templateUrl: "./account-offline.component.html",
	styleUrls: ["./account-offline.component.scss"],
	imports: [
		IonButton,
		IonIcon,
		IonProgressBar,
		DatePipe,
		CardComponent,
		CardHeaderComponent,
		CardTitleComponent,
		CardContentComponent,
	],
})
export class AccountOfflineComponent {
	readonly meta = this.offlineData.meta;
	readonly progress = this.offlineData.progress;
	readonly offline = this.offlineData.offline;

	constructor(
		private readonly offlineData: OfflineDataService,
		private readonly modalService: ModalService,
	) {
		addIcons({ cloudOfflineOutline, cloudDownloadOutline, checkmarkCircleOutline, refreshOutline, trashOutline });
	}

	enable() {
		this.offlineData.enable();
	}

	download() {
		this.offlineData.download();
	}

	async disable() {
		const confirmed = await this.modalService.deleteConfirmationModal(
			"Opravdu smazat staženou databázi z tohoto zařízení?",
		);
		if (confirmed) await this.offlineData.disable();
	}
}
