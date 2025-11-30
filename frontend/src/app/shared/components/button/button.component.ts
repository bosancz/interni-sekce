import { Component, Input } from "@angular/core";
import { Color } from "@ionic/core";

@Component({
	selector: "bo-button",
	standalone: false,
	templateUrl: "./button.component.html",
	styleUrl: "./button.component.scss",
})
export class ButtonComponent {
	@Input() color: Color = "primary";
}
