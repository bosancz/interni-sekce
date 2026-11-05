import { Component, computed, input, output } from "@angular/core";
import { Router, RouterLink } from "@angular/router";
import { addIcons } from "ionicons";
import { chevronDown } from "ionicons/icons";
import { MemberRoles } from "src/app/core/config/member-roles";
import { ModalService } from "src/app/core/services/modal.service";
import { IonIcon, IonSkeletonText } from "@ionic/angular/standalone";
import { DeleteButtonComponent } from "src/app/shared/components/delete-button/delete-button.component";
import { GroupBadgeComponent } from "src/app/shared/components/group-badge/group-badge.component";
import { SDK } from "src/sdk";
import { MemberPipe } from "../../../../shared/pipes/member.pipe";
import { RolePipe } from "../../../../shared/pipes/role.pipe";
import { AttendeeNote } from "./attendee-note";

@Component({
	selector: "bo-event-attendees-list",
	templateUrl: "./event-attendees-list.component.html",
	styleUrl: "./event-attendees-list.component.scss",

	imports: [RouterLink, IonIcon, IonSkeletonText, GroupBadgeComponent, DeleteButtonComponent, MemberPipe, RolePipe],
})
export class EventAttendeesListComponent {
	event = input<SDK.EventResponseWithLinks | null | undefined>();
	attendees = input<SDK.EventAttendeeResponseWithLinks[] | undefined>();
	notes = input<Map<number, AttendeeNote[]>>(new Map());

	remove = output<SDK.EventAttendeeResponseWithLinks>();
	roleChange = output<{ attendee: SDK.EventAttendeeResponseWithLinks; role: SDK.MemberRolesEnum }>();

	loadingArray = new Array(10).fill(null);

	canRemoveAny = computed(() => !!this.attendees()?.some((a) => a._links.deleteEventAttendee.allowed));

	constructor(
		private readonly modalService: ModalService,
		private readonly router: Router,
	) {
		addIcons({ chevronDown });
	}

	async selectRole(attendee: SDK.EventAttendeeResponseWithLinks) {
		const role = await this.modalService.selectModal<SDK.MemberRolesEnum>({
			header: "Role na akci",
			message: `Jako kdo jel ${attendee.member?.nickname ?? "účastník"} na tuhle akci.`,
			values: (Object.keys(MemberRoles) as SDK.MemberRolesEnum[]).map((value) => ({
				value,
				label: MemberRoles[value].title,
			})),
			value: attendee.role,
		});

		if (role) this.roleChange.emit({ attendee, role });
	}

	open(attendee: SDK.EventAttendeeResponseWithLinks) {
		this.router.navigate(["/databaze/clenove", attendee.memberId]);
	}

	hasBirthday(notes: AttendeeNote[]) {
		return notes.some((note) => note.tone === "birthday");
	}
}
