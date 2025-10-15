import { Component, Input } from "@angular/core";

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
