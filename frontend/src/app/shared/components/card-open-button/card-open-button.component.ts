import { Component } from "@angular/core";
import { IonButton, IonIcon } from "@ionic/angular/standalone";
import { addIcons } from "ionicons";
import { arrowForwardOutline } from "ionicons/icons";

@Component({
	selector: "bo-card-open-button",
	templateUrl: "./card-open-button.component.html",
	styleUrl: "./card-open-button.component.scss",

	imports: [IonButton, IonIcon],
})
export class CardOpenButtonComponent {
	constructor() {
		addIcons({ arrowForwardOutline });
	}
}
