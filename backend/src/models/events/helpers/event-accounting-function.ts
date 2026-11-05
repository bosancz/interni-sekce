import { isMembershipPaid } from "src/helpers/membership";
import { EventAttendee, EventAttendeeType } from "../entities/event-attendee.entity";

export const ACCOUNTING_FUNCTION_LEADER = "h";
export const ACCOUNTING_FUNCTION_NON_MEMBER = "n";

export function getEventAccountingFunction(attendee: EventAttendee, membershipYear: number): string | undefined {
	if (attendee.type === EventAttendeeType.leader) return ACCOUNTING_FUNCTION_LEADER;
	if (attendee.member && !isMembershipPaid(attendee.member.membership, membershipYear))
		return ACCOUNTING_FUNCTION_NON_MEMBER;
	return attendee.member?.role?.charAt(0) || undefined;
}
