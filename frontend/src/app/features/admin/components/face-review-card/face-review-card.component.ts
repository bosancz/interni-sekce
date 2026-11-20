import { Component } from "@angular/core";
import { IonIcon } from "@ionic/angular/standalone";
import { addIcons } from "ionicons";
import { scanOutline } from "ionicons/icons";
import { FaceReviewComponent } from "src/app/features/albums/components/face-review/face-review.component";
import { CardContentComponent } from "src/app/shared/components/card-content/card-content.component";
import { CardHeaderComponent } from "src/app/shared/components/card-header/card-header.component";
import { CardTitleComponent } from "src/app/shared/components/card-title/card-title.component";
import { CardComponent } from "src/app/shared/components/card/card.component";

@Component({
	selector: "bo-face-review-card",
	templateUrl: "./face-review-card.component.html",
	styleUrl: "./face-review-card.component.scss",
	imports: [
		IonIcon,
		CardComponent,
		CardHeaderComponent,
		CardTitleComponent,
		CardContentComponent,
		FaceReviewComponent,
	],
})
export class FaceReviewCardComponent {
	constructor() {
		addIcons({ scanOutline });
	}
}
