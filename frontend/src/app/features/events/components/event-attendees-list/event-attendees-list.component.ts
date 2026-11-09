import { CdkDrag, CdkDragDrop, CdkDragHandle, CdkDropList, moveItemInArray } from "@angular/cdk/drag-drop";
import { Component, computed, input, output } from "@angular/core";
import { NgTemplateOutlet } from "@angular/common";
import { Router, RouterLink } from "@angular/router";
import { addIcons } from "ionicons";
import { chevronDown, ellipsisVertical, flag, personOutline, reorderTwo, trashOutline } from "ionicons/icons";
import { MemberRoles } from "src/app/core/config/member-roles";
import { IonIcon, IonSkeletonText } from "@ionic/angular/standalone";
import {
	DropdownMenuComponent,
	DropdownMenuOption,
} from "src/app/shared/components/dropdown-menu/dropdown-menu.component";
import { GroupBadgeComponent } from "src/app/shared/components/group-badge/group-badge.component";
import { TooltipDirective } from "src/app/shared/directives/tooltip.directive";
import { SDK } from "src/sdk";
import { MemberPipe } from "../../../../shared/pipes/member.pipe";
import { RolePipe } from "../../../../shared/pipes/role.pipe";
import { AttendeeNote } from "./attendee-note";

export type AttendeeAction = "lead" | "unlead" | "profile" | "remove";

@Component({
	selector: "bo-event-attendees-list",
	templateUrl: "./event-attendees-list.component.html",
	styleUrl: "./event-attendees-list.component.scss",

	imports: [
		RouterLink,
		NgTemplateOutlet,
		TooltipDirective,
		CdkDropList,
		CdkDrag,
		CdkDragHandle,
		IonIcon,
		IonSkeletonText,
		DropdownMenuComponent,
		GroupBadgeComponent,
		MemberPipe,
		RolePipe,
	],
})
export class EventAttendeesListComponent {
	event = input<SDK.EventResponseWithLinks | null | undefined>();
	attendees = input<SDK.EventAttendeeResponseWithLinks[] | undefined>();
	notes = input<Map<number, AttendeeNote[]>>(new Map());

	remove = output<SDK.EventAttendeeResponseWithLinks>();
	roleChange = output<{ attendee: SDK.EventAttendeeResponseWithLinks; role: SDK.MemberRolesEnum }>();
	leadChange = output<{ attendee: SDK.EventAttendeeResponseWithLinks; lead: boolean }>();
	leadersReorder = output<number[]>();

	readonly roleOptions: DropdownMenuOption<SDK.MemberRolesEnum>[] = (
		Object.keys(MemberRoles) as SDK.MemberRolesEnum[]
	)
		.reverse()
		.map((value) => ({ value, label: MemberRoles[value].title }));

	leaders = computed(() => this.attendees()?.filter((a) => a.type === "leader") ?? []);
	others = computed(() => this.attendees()?.filter((a) => a.type !== "leader") ?? []);

	reorderable = computed(() => !!this.event()?._links?.updateEventLeadersOrder?.allowed && this.leaders().length > 1);

	loadingArray = new Array(10).fill(null);

	constructor(private readonly router: Router) {
		addIcons({ chevronDown, ellipsisVertical, flag, personOutline, reorderTwo, trashOutline });
	}

	actionOptions(attendee: SDK.EventAttendeeResponseWithLinks): DropdownMenuOption<AttendeeAction>[] {
		const options: DropdownMenuOption<AttendeeAction>[] = [];
		if (attendee._links.updateEventAttendee.allowed) {
			if (attendee.type === "leader")
				options.push({ value: "unlead", label: "Odebrat z vedení akce", icon: "flag" });
			else if (attendee.role !== SDK.MemberRolesEnum.Dite)
				options.push({ value: "lead", label: "Povýšit na vedoucího akce", icon: "flag", bold: true });
		}
		options.push({ value: "profile", label: "Otevřít profil", icon: "person-outline" });
		if (attendee._links.deleteEventAttendee.allowed)
			options.push({
				value: "remove",
				label: "Odebrat z akce",
				icon: "trash-outline",
				danger: true,
				divider: true,
			});
		return options;
	}

	action(attendee: SDK.EventAttendeeResponseWithLinks, action: AttendeeAction) {
		if (action === "lead") this.leadChange.emit({ attendee, lead: true });
		else if (action === "unlead") this.leadChange.emit({ attendee, lead: false });
		else if (action === "profile") this.open(attendee);
		else this.remove.emit(attendee);
	}

	dropLeader(event: CdkDragDrop<unknown>) {
		if (event.previousIndex === event.currentIndex) return;
		const memberIds = this.leaders().map((leader) => leader.memberId);
		moveItemInArray(memberIds, event.previousIndex, event.currentIndex);
		this.leadersReorder.emit(memberIds);
	}

	open(attendee: SDK.EventAttendeeResponseWithLinks) {
		this.router.navigate(["/databaze/clenove", attendee.memberId]);
	}

	hasBirthday(notes: AttendeeNote[]) {
		return notes.some((note) => note.tone === "birthday");
	}
}
