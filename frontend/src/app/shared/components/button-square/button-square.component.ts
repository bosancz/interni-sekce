import { Component, input } from "@angular/core";

@Component({
	selector: "bo-button-square",
	standalone: false,
	templateUrl: "./button-square.component.html",
	styleUrl: "./button-square.component.scss",
})
export class ButtonSquareComponent {
	label = input.required<string>();
	image = input.required<string>();
	color = input.required<string>();
}
