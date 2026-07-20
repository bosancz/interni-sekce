import { Component, computed, inject, input } from "@angular/core";
import { IonIcon, IonItem, IonLabel } from "@ionic/angular/standalone";
import { VerticalMenuComponent } from "../vertical-menu/vertical-menu.component";

@Component({
	selector: "bo-vertical-menu-item",
	templateUrl: "./vertical-menu-item.component.html",
	styleUrls: ["./vertical-menu-item.component.scss"],
	imports: [IonItem, IonLabel, IonIcon],
})
export class VerticalMenuItemComponent {
	name = input.required<string>();
	label = input.required<string>();
	icon = input<string>();

	menu = inject(VerticalMenuComponent);

	isActive = computed(() => this.menu.currentTab() === this.name());

	onClick(): void {
		this.menu.onItemClick(this.name());
	}
}
