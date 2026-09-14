import { Component, input } from "@angular/core";
import { CardHeaderComponent } from "../card-header/card-header.component";
import { CardTitleComponent } from "../card-title/card-title.component";
import { CardComponent } from "../card/card.component";

@Component({
	selector: "bo-button-square",

	imports: [CardComponent, CardHeaderComponent, CardTitleComponent],
	templateUrl: "./button-square.component.html",
	styleUrl: "./button-square.component.scss",
})
export class ButtonSquareComponent {
	label = input.required<string>();
	image = input.required<string>();
	color = input.required<string>();
	tint = input<string>();
}
