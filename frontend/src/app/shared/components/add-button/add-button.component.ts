import { Component, input } from "@angular/core";
import { IonButton, IonIcon } from "@ionic/angular/standalone";
import { addIcons } from "ionicons";
import { addCircleOutline } from "ionicons/icons";

@Component({
	selector: "bo-add-button",
	templateUrl: "./add-button.component.html",
	styleUrl: "./add-button.component.scss",

	imports: [IonButton, IonIcon],
})
export class AddButtonComponent {
	disabled = input<boolean | undefined>();

	constructor() {
		addIcons({ addCircleOutline });
	}
}
