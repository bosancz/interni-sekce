import { Component, input } from "@angular/core";
import { IonButton, IonIcon } from "@ionic/angular/standalone";
import { addIcons } from "ionicons";
import { trashOutline } from "ionicons/icons";

@Component({
	selector: "bo-delete-button",
	templateUrl: "./delete-button.component.html",
	styleUrl: "./delete-button.component.scss",

	imports: [IonButton, IonIcon],
})
export class DeleteButtonComponent {
	label = input<string | undefined>();

	constructor() {
		addIcons({ trashOutline });
	}
}
