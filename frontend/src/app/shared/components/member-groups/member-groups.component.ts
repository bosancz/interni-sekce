import { Component, computed, input } from "@angular/core";
import { getMemberGroups } from "src/helpers/member-groups";
import { SDK } from "src/sdk";
import { GroupPipe } from "../../pipes/group.pipe";
import { GroupBadgeComponent } from "../group-badge/group-badge.component";

@Component({
	selector: "bo-member-groups",
	templateUrl: "./member-groups.component.html",
	styleUrl: "./member-groups.component.scss",
	imports: [GroupBadgeComponent, GroupPipe],
})
export class MemberGroupsComponent {
	member = input.required<Pick<SDK.MemberResponse, "groupId" | "groupMemberships"> | null | undefined>();

	reversed = input<boolean>(false);

	groups = computed(() => {
		const groups = getMemberGroups(this.member());
		return this.reversed() ? groups.reverse() : groups;
	});
}
