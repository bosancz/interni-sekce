import { Component, input } from "@angular/core";

@Component({
	selector: "bo-avatar",
	templateUrl: "./avatar.component.html",
	styleUrl: "./avatar.component.scss",
	host: {
		"[class.ringed]": "!!photoUrl() && !!color()",
		"[class.empty]": "!photoUrl() && !initials()",
		"[style.background-color]": "photoUrl() && color() ? color() : null",
	},
})
export class AvatarComponent {
	initials = input<string | null>(null);
	photoUrl = input<string | null | undefined>(null);
	color = input<string | null | undefined>(null);
}
