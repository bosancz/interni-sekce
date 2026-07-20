import { Component, input, Optional, signal } from "@angular/core";
import { RouterLink } from "@angular/router";
import { IonLabel, IonRippleEffect, IonSkeletonText } from "@ionic/angular/standalone";

@Component({
	selector: "bo-item",
	templateUrl: "./item.component.html",
	styleUrl: "./item.component.scss",
	host: { "[class.ion-activatable]": "button()", "[class.clickable]": "button() || hasRouterLink()" },

	imports: [IonLabel, IonSkeletonText, IonRippleEffect],
})
export class ItemComponent {
	label = input<string>();
	loading = input<boolean>();
	lines = input<string>();
	button = input<boolean>();
	detail = input<boolean>();

	hasRouterLink = signal(false);

	constructor(@Optional() routerLink: RouterLink) {
		this.hasRouterLink.set(!!routerLink);
	}
}
