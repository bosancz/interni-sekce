import { DatePipe } from "@angular/common";
import { Component, computed, input, output } from "@angular/core";
import { RouterLink } from "@angular/router";
import { IonBadge, IonList, IonReorder, IonReorderGroup, IonSkeletonText } from "@ionic/angular/standalone";
import { ItemReorderEventDetail } from "@ionic/core";
import { DeleteButtonComponent } from "src/app/shared/components/delete-button/delete-button.component";
import { GroupBadgeComponent } from "src/app/shared/components/group-badge/group-badge.component";
import { ItemComponent } from "src/app/shared/components/item/item.component";
import { TooltipDirective } from "src/app/shared/directives/tooltip.directive";
import { MemberItemDetailComponent } from "src/app/shared/components/member-item-detail/member-item-detail.component";
import { hasBirthdayBetween } from "src/helpers/age";
import { SDK } from "src/sdk";
import { MemberPipe } from "../../../../shared/pipes/member.pipe";
import { RolePipe } from "../../../../shared/pipes/role.pipe";

@Component({
	selector: "bo-event-attendees-list",
	templateUrl: "./event-attendees-list.component.html",
	styleUrl: "./event-attendees-list.component.scss",

	imports: [
		ItemComponent,
		RouterLink,
		IonList,
		IonBadge,
		IonSkeletonText,
		IonReorderGroup,
		IonReorder,
		TooltipDirective,
		GroupBadgeComponent,
		DeleteButtonComponent,
		MemberItemDetailComponent,
		MemberPipe,
		DatePipe,
		RolePipe,
	],
})
export class EventAttendeesListComponent {
	event = input<SDK.EventResponseWithLinks | null | undefined>();
	attendees = input<SDK.EventAttendeeResponseWithLinks[] | undefined>();
	sortable = input<boolean>(false);

	remove = output<SDK.EventAttendeeResponseWithLinks>();
	add = output<void>();
	reorder = output<SDK.EventAttendeeResponseWithLinks[]>();

	loadingArray = new Array(10).fill(null);

	reorderable = computed(() => this.sortable() && (this.attendees()?.length ?? 0) > 1);

	canRemoveAny = computed(() => !!this.attendees()?.some((a) => a._links.deleteEventAttendee.allowed));

	onReorder(ev: CustomEvent<ItemReorderEventDetail>) {
		const attendees = this.attendees();
		if (!attendees) {
			ev.detail.complete();
			return;
		}

		this.reorder.emit(ev.detail.complete([...attendees]) as SDK.EventAttendeeResponseWithLinks[]);
	}

	hasBirthday(attendee: SDK.EventAttendeeResponseWithLinks) {
		const event = this.event();
		return hasBirthdayBetween(attendee.member?.birthday, event?.dateFrom, event?.dateTill);
	}
}
