import { Component, EventEmitter, Input, Output } from "@angular/core";
import { DateTime } from "luxon";
import { EventAttendeeResponseWithLinks, EventResponseWithLinks } from "src/app/api";

@Component({
  selector: "bo-event-attendees-list",
  templateUrl: "./event-attendees-list.component.html",
  styleUrl: "./event-attendees-list.component.scss",
})
export class EventAttendeesListComponent {
  @Input() event?: EventResponseWithLinks | null;
  @Input() attendees?: EventAttendeeResponseWithLinks[];

  @Output() remove = new EventEmitter<EventAttendeeResponseWithLinks>();
  @Output() add = new EventEmitter<void>();

  loadingArray = new Array(10).fill(null);

  hasBirthday(attendee: EventAttendeeResponseWithLinks) {
    if (!attendee.member?.birthday || !this.event?.dateFrom || !this.event?.dateTill) return false;

    const eventFrom = DateTime.fromISO(this.event?.dateFrom);
    const eventTill = DateTime.fromISO(this.event?.dateTill);

    let birthday = DateTime.fromISO(attendee.member.birthday).set({ year: eventFrom.year });
    if (birthday < eventFrom) birthday = birthday.plus({ years: 1 });

    return birthday <= eventTill;
  }
}
