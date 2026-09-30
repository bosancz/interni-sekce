import { Member } from "src/models/members/entities/member.entity";
import { EventAttendee, EventAttendeeType } from "../entities/event-attendee.entity";

export function compareEventAttendeePositions(a: EventAttendee, b: EventAttendee) {
	if (a.position !== b.position) {
		if (a.position === null || a.position === undefined) return 1;
		if (b.position === null || b.position === undefined) return -1;
		return a.position - b.position;
	}

	return (a.member?.nickname ?? "").localeCompare(b.member?.nickname ?? "", "cs") || a.memberId - b.memberId;
}

export function getEventLeaders(attendees?: EventAttendee[] | null): Member[] {
	return (attendees ?? [])
		.filter((a) => a.member && a.type === EventAttendeeType.leader)
		.sort(compareEventAttendeePositions)
		.map((a) => a.member!);
}
