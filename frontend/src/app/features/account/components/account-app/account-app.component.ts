import { Component } from "@angular/core";
import { IonButton, IonIcon } from "@ionic/angular/standalone";
import { addIcons } from "ionicons";
import {
	checkmarkCircleOutline,
	downloadOutline,
	informationCircleOutline,
	phonePortraitOutline,
} from "ionicons/icons";
import { PwaInstallService } from "src/app/core/services/pwa-install.service";
import { CardContentComponent } from "src/app/shared/components/card-content/card-content.component";
import { CardHeaderComponent } from "src/app/shared/components/card-header/card-header.component";
import { CardTitleComponent } from "src/app/shared/components/card-title/card-title.component";
import { CardComponent } from "src/app/shared/components/card/card.component";

@Component({
	selector: "bo-account-app",
	templateUrl: "./account-app.component.html",
	styleUrls: ["./account-app.component.scss"],
	imports: [
		IonButton,
		IonIcon,
		CardComponent,
		CardHeaderComponent,
		CardTitleComponent,
		CardContentComponent,
	],
})
export class AccountAppComponent {
	readonly canInstall = this.pwaInstall.canInstall;

	readonly installed = this.pwaInstall.installed;

	constructor(private readonly pwaInstall: PwaInstallService) {
		addIcons({
			phonePortraitOutline,
			informationCircleOutline,
			checkmarkCircleOutline,
			downloadOutline,
		});
	}

	install() {
		this.pwaInstall.install();
	}
}
