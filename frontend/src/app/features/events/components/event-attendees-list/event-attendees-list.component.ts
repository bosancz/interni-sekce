import { DatePipe } from "@angular/common";
import { Component, EventEmitter, Input, Output } from "@angular/core";
import { RouterLink } from "@angular/router";
import { IonBadge, IonList, IonSkeletonText } from "@ionic/angular/standalone";
import { DateTime } from "luxon";
import { DeleteButtonComponent } from "src/app/shared/components/delete-button/delete-button.component";
import { GroupBadgeComponent } from "src/app/shared/components/group-badge/group-badge.component";
import { ItemComponent } from "src/app/shared/components/item/item.component";
import { MemberItemDetailComponent } from "src/app/shared/components/member-item-detail/member-item-detail.component";
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
		GroupBadgeComponent,
		DeleteButtonComponent,
		MemberItemDetailComponent,
		MemberPipe,
		DatePipe,
		RolePipe,
	],
})
export class EventAttendeesListComponent {
	@Input() event?: SDK.EventResponseWithLinks | null;
	@Input() attendees?: SDK.EventAttendeeResponseWithLinks[];

	@Output() remove = new EventEmitter<SDK.EventAttendeeResponseWithLinks>();
	@Output() add = new EventEmitter<void>();

	loadingArray = new Array(10).fill(null);

	hasBirthday(attendee: SDK.EventAttendeeResponseWithLinks) {
		if (!attendee.member?.birthday || !this.event?.dateFrom || !this.event?.dateTill) return false;

		const eventFrom = DateTime.fromISO(this.event?.dateFrom);
		const eventTill = DateTime.fromISO(this.event?.dateTill);

		let birthday = DateTime.fromISO(attendee.member.birthday).set({ year: eventFrom.year });
		if (birthday < eventFrom) birthday = birthday.plus({ years: 1 });

		return birthday <= eventTill;
	}
}
