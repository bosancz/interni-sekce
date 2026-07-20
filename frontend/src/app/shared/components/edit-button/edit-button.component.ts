import { Component, input } from "@angular/core";
import { IonButton, IonIcon } from "@ionic/angular/standalone";
import { addIcons } from "ionicons";
import { createOutline } from "ionicons/icons";

@Component({
	selector: "bo-edit-button",
	templateUrl: "./edit-button.component.html",
	styleUrls: ["./edit-button.component.scss"],

	imports: [IonButton, IonIcon],
})
export class EditButtonComponent {
	label = input<string | undefined>();
	disabled = input<boolean | undefined>();

	constructor() {
		addIcons({ createOutline });
	}
}
