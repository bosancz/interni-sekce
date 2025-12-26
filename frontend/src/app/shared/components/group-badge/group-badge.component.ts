import { Component, Input } from "@angular/core";
import { SDK } from "src/sdk";

@Component({
	selector: "bo-group-badge",
	templateUrl: "./group-badge.component.html",
	styleUrl: "./group-badge.component.scss",
	standalone: false,
})
export class GroupBadgeComponent {
	@Input() groupId!: SDK.GroupResponse["id"];
	@Input() short = false;
}
