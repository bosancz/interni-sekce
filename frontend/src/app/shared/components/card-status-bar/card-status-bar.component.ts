import { Component, input } from "@angular/core";

@Component({
	selector: "bo-card-status-bar",
	imports: [],
	templateUrl: "./card-status-bar.component.html",
	styleUrl: "./card-status-bar.component.scss",
	host: {
		"[style.background-color]": "color() ?? 'transparent'",
		"[style.color]": "color() ? '#fff' : 'inherit'",
	},
})
export class CardStatusBarComponent {
	color = input<string | undefined>(undefined);
}
