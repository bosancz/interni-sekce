import { Component, Input } from "@angular/core";
import { IonButton, IonIcon } from "@ionic/angular/standalone";

@Component({
	selector: "bo-edit-button",
	templateUrl: "./edit-button.component.html",
	styleUrls: ["./edit-button.component.scss"],
	standalone: true,
	imports: [IonButton, IonIcon],
})
export class EditButtonComponent {
	@Input() label?: string;
	@Input() disabled?: boolean;
}
