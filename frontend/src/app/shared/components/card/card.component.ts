import { Component, input, OnInit, Optional, signal } from "@angular/core";
import { RouterLink } from "@angular/router";

@Component({
	selector: "bo-card",
	templateUrl: "./card.component.html",
	styleUrls: ["./card.component.scss"],
	
	host: {
		"[style]": "'--card-color: ' + (color() || 'black')",
		"[class.clickable]": "hasRouterLink()",
		"[class.mousedown]": "mouseDown()",
		"(mousedown)": "mouseDown.set(true)",
		"(mouseup)": "mouseDown.set(false)",
		"(mouseleave)": "mouseDown.set(false)",
	},
})
export class CardComponent implements OnInit {
	title = input<string>();
	color = input<string>();

	hasRouterLink = signal<boolean>(false);
	mouseDown = signal<boolean>(false);

	constructor(@Optional() routerLink?: RouterLink) {
		this.hasRouterLink.set(!!routerLink);
	}

	ngOnInit(): void {}
}
