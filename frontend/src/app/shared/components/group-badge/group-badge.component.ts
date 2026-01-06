import { Component, Input } from "@angular/core";
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
	@Input() groupId!: SDK.GroupResponse["id"];
	@Input() short = false;
}
