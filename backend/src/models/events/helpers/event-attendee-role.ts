import { DateTime } from "luxon";
import { MemberRoles } from "src/models/members/schema/member-roles";

export interface AttendeeRoleAges {
	instructorFrom: number;
	leaderFrom: number;
}

export function getAttendeeRoleByAge(
	birthday: string | null | undefined,
	eventDateFrom: string,
	fallback: MemberRoles,
	ages: AttendeeRoleAges,
): MemberRoles {
	if (!birthday) return fallback;

	const age = DateTime.fromISO(eventDateFrom).diff(DateTime.fromISO(birthday), "years").years;

	if (age >= ages.leaderFrom) return MemberRoles.vedouci;
	if (age >= ages.instructorFrom) return MemberRoles.instruktor;
	return MemberRoles.dite;
}
