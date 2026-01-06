import { Component } from "@angular/core";
import { IonButton, IonIcon } from "@ionic/angular/standalone";

@Component({
	selector: "bo-add-button",
	templateUrl: "./add-button.component.html",
	styleUrl: "./add-button.component.scss",
	standalone: true,
	imports: [IonButton, IonIcon],
})
export class AddButtonComponent {}
