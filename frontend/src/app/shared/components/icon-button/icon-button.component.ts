import { Component, Input } from "@angular/core";
import { IonButton, IonIcon } from "@ionic/angular/standalone";

@Component({
	selector: "bo-icon-button",
	templateUrl: "./icon-button.component.html",
	styleUrl: "./icon-button.component.scss",
	
	imports: [IonButton, IonIcon],
})
export class IconButtonComponent {
	@Input() label?: string;
	@Input() icon?: string;
	@Input() href?: string;

	constructor() {}

	onClick(event: Event) {
		event.preventDefault();
		event.stopPropagation();

		if (this.href) {
			window.location.href = this.href;
		}
	}
}
