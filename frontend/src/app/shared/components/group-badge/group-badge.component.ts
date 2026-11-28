import { Component, input } from "@angular/core";
import { IonBadge } from "@ionic/angular/standalone";
import { SDK } from "src/sdk";
import { GroupPipe } from "../../pipes/group.pipe";

@Component({
	selector: "bo-group-badge",
	templateUrl: "./group-badge.component.html",
	styleUrl: "./group-badge.component.scss",

	imports: [IonBadge, GroupPipe],
})
export class GroupBadgeComponent {
	groupId = input.required<SDK.GroupResponse["id"] | null | undefined>();
	short = input<boolean>(false);
	inactive = input<boolean>(false);
}
