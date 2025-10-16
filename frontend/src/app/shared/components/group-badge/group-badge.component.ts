import { Component, Input } from "@angular/core";
import { BackendApiTypes } from "src/sdk/backend.client";

@Component({
	selector: "bo-group-badge",
	templateUrl: "./group-badge.component.html",
	styleUrl: "./group-badge.component.scss",
	standalone: false,
})
export class GroupBadgeComponent {
	@Input() groupId!: BackendApiTypes.GroupResponse["id"];
	@Input() short = false;
}
