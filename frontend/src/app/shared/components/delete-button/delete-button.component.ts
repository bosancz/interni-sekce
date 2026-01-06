import { Component, Input } from "@angular/core";
import { IonButton, IonIcon } from "@ionic/angular/standalone";

@Component({
	selector: "bo-delete-button",
	templateUrl: "./delete-button.component.html",
	styleUrl: "./delete-button.component.scss",
	standalone: true,
	imports: [IonButton, IonIcon],
})
export class DeleteButtonComponent {
	@Input() label?: string;
}
