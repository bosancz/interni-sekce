import { Component, Input } from "@angular/core";
import { IonLabel, IonRippleEffect, IonSkeletonText } from "@ionic/angular/standalone";

@Component({
	selector: "bo-item",
	templateUrl: "./item.component.html",
	styleUrl: "./item.component.scss",
	host: { "[class.ion-activatable]": "button", "[class.clickable]": "button || !!routerLink" },
	standalone: true,
	imports: [IonLabel, IonSkeletonText, IonRippleEffect],
})
export class ItemComponent {
	@Input() label?: string;
	@Input() loading?: boolean;
	@Input() lines?: string;
	@Input() button?: boolean;
	@Input() detail?: boolean;
}
