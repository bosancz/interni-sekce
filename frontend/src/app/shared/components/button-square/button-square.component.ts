import { Component, input } from "@angular/core";
import { CardContentComponent } from "../card-content/card-content.component";
import { CardHeaderComponent } from "../card-header/card-header.component";
import { CardTitleComponent } from "../card-title/card-title.component";
import { CardComponent } from "../card/card.component";

@Component({
	selector: "bo-button-square",
	standalone: true,
	imports: [CardComponent, CardHeaderComponent, CardTitleComponent, CardContentComponent],
	templateUrl: "./button-square.component.html",
	styleUrl: "./button-square.component.scss",
})
export class ButtonSquareComponent {
	label = input.required<string>();
	image = input.required<string>();
	color = input.required<string>();
}
