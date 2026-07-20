import { Component, input } from "@angular/core";
import { Color } from "@ionic/core";

@Component({
	selector: "bo-button",

	templateUrl: "./button.component.html",
	styleUrl: "./button.component.scss",
})
export class ButtonComponent {
	color = input<Color>("primary");
}
