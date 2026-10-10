import { DatePipe } from "@angular/common";
import { Component } from "@angular/core";
import { IonButton, IonIcon, IonProgressBar } from "@ionic/angular/standalone";
import { addIcons } from "ionicons";
import { checkmarkCircleOutline, cloudDownloadOutline, cloudOfflineOutline, refreshOutline } from "ionicons/icons";
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

	constructor(private readonly offlineData: OfflineDataService) {
		addIcons({ cloudOfflineOutline, cloudDownloadOutline, checkmarkCircleOutline, refreshOutline });
	}

	download() {
		this.offlineData.download();
	}
}
