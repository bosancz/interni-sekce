import { Component, computed, input } from "@angular/core";
import { IonBadge } from "@ionic/angular/standalone";

const MAX_COUNT = 99;

@Component({
	selector: "bo-unread-badge",
	templateUrl: "./unread-badge.component.html",
	styleUrl: "./unread-badge.component.scss",

	imports: [IonBadge],
})
export class UnreadBadgeComponent {
	count = input.required<number>();

	label = computed(() => (this.count() > MAX_COUNT ? `${MAX_COUNT}+` : `${this.count()}`));
}
