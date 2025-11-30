import { Component, input } from "@angular/core";

@Component({
	selector: "bo-avatar",
	standalone: false,
	templateUrl: "./avatar.component.html",
	styleUrl: "./avatar.component.scss",
})
export class AvatarComponent {
	initials = input<string | null>(null);
}
