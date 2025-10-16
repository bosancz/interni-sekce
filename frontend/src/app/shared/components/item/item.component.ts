import { Component, Input } from "@angular/core";

@Component({
	selector: "bo-item",
	templateUrl: "./item.component.html",
	styleUrl: "./item.component.scss",
	host: { "[class.ion-activatable]": "button", "[class.clickable]": "button || !!routerLink" },
	standalone: false,
})
export class ItemComponent {
	@Input() label?: string;
	@Input() loading?: boolean;
	@Input() lines?: string;
	@Input() button?: boolean;
	@Input() detail?: boolean;
}
