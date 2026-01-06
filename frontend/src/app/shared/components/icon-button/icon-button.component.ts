import { Component, input } from "@angular/core";
import { IonButton, IonIcon } from "@ionic/angular/standalone";

@Component({
	selector: "bo-icon-button",
	templateUrl: "./icon-button.component.html",
	styleUrl: "./icon-button.component.scss",
	
	imports: [IonButton, IonIcon],
})
export class IconButtonComponent {
	label = input<string | undefined>();
	icon = input<string | undefined>();
	href = input<string | undefined>();

	constructor() {}

	onClick(event: Event) {
		event.preventDefault();
		event.stopPropagation();

		const href = this.href();
		if (href) {
			window.location.href = href;
		}
	}
}
