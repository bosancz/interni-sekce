import { Component, computed, input, output } from "@angular/core";
import { Router, RouterLink } from "@angular/router";
import { addIcons } from "ionicons";
import { chevronDown } from "ionicons/icons";
import { MemberRoles } from "src/app/core/config/member-roles";
import { IonIcon, IonSkeletonText } from "@ionic/angular/standalone";
import {
	DropdownMenuComponent,
	DropdownMenuOption,
} from "src/app/shared/components/dropdown-menu/dropdown-menu.component";
import { DeleteButtonComponent } from "src/app/shared/components/delete-button/delete-button.component";
import { GroupBadgeComponent } from "src/app/shared/components/group-badge/group-badge.component";
import { SDK } from "src/sdk";
import { MemberPipe } from "../../../../shared/pipes/member.pipe";
import { RolePipe } from "../../../../shared/pipes/role.pipe";
import { AttendeeNote } from "./attendee-note";

export const EVENT_LEADER_ROLE = "eventLeader";

export type AttendeeRoleChoice = SDK.MemberRolesEnum | typeof EVENT_LEADER_ROLE;

@Component({
	selector: "bo-event-attendees-list",
	templateUrl: "./event-attendees-list.component.html",
	styleUrl: "./event-attendees-list.component.scss",

	imports: [
		RouterLink,
		IonIcon,
		IonSkeletonText,
		DropdownMenuComponent,
		GroupBadgeComponent,
		DeleteButtonComponent,
		MemberPipe,
		RolePipe,
	],
})
export class EventAttendeesListComponent {
	event = input<SDK.EventResponseWithLinks | null | undefined>();
	attendees = input<SDK.EventAttendeeResponseWithLinks[] | undefined>();
	notes = input<Map<number, AttendeeNote[]>>(new Map());

	remove = output<SDK.EventAttendeeResponseWithLinks>();
	roleChange = output<{ attendee: SDK.EventAttendeeResponseWithLinks; role: AttendeeRoleChoice }>();

	readonly roleOptions: DropdownMenuOption<AttendeeRoleChoice>[] = [
		{ value: EVENT_LEADER_ROLE, label: "vede akci", bold: true },
		...(Object.keys(MemberRoles) as SDK.MemberRolesEnum[]).reverse().map((value) => ({
			value,
			label: MemberRoles[value].title,
		})),
	];

	loadingArray = new Array(10).fill(null);

	canRemoveAny = computed(() => !!this.attendees()?.some((a) => a._links.deleteEventAttendee.allowed));

	constructor(private readonly router: Router) {
		addIcons({ chevronDown });
	}

	roleChoice(attendee: SDK.EventAttendeeResponseWithLinks): AttendeeRoleChoice {
		return attendee.type === "leader" ? EVENT_LEADER_ROLE : attendee.role;
	}

	open(attendee: SDK.EventAttendeeResponseWithLinks) {
		this.router.navigate(["/databaze/clenove", attendee.memberId]);
	}

	hasBirthday(notes: AttendeeNote[]) {
		return notes.some((note) => note.tone === "birthday");
	}
}
