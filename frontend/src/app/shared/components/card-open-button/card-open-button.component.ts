import { Component } from "@angular/core";
import { IonButton, IonIcon } from "@ionic/angular/standalone";

@Component({
	selector: "bo-card-open-button",
	templateUrl: "./card-open-button.component.html",
	styleUrl: "./card-open-button.component.scss",
	standalone: true,
	imports: [IonButton, IonIcon],
})
export class CardOpenButtonComponent {}
