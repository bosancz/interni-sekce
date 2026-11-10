import { Component, computed, inject, input } from "@angular/core";
import { toSignal } from "@angular/core/rxjs-interop";
import { IonBadge } from "@ionic/angular/standalone";
import { LeadersEventGroup } from "src/app/core/config/leaders-event";
import { GroupsService } from "src/app/core/services/groups.service";
import { GroupPipe } from "../../pipes/group.pipe";

@Component({
	selector: "bo-event-groups",
	templateUrl: "./event-groups.component.html",
	styleUrl: "./event-groups.component.scss",
	imports: [IonBadge, GroupPipe],
})
export class EventGroupsComponent {
	groupsIds = input<number[]>([]);
	leadersEvent = input<boolean>(false);

	readonly leadersGroup = LeadersEventGroup;

	private readonly groups = toSignal(inject(GroupsService).groups, { initialValue: [] });

	sortedGroupsIds = computed(() => {
		const order = this.groups().map((group) => group.id);
		const rank = (id: number) => (order.indexOf(id) === -1 ? order.length : order.indexOf(id));
		return [...this.groupsIds()].sort((a, b) => rank(a) - rank(b));
	});
}
