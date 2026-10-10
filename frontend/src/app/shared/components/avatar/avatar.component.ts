import { Component, input } from "@angular/core";

@Component({
	selector: "bo-avatar",
	templateUrl: "./avatar.component.html",
	styleUrl: "./avatar.component.scss",
})
export class AvatarComponent {
	initials = input<string | null>(null);
	photoUrl = input<string | null | undefined>(null);
	color = input<string | null | undefined>(null);
}
