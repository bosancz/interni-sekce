import { Member } from "src/models/members/entities/member.entity";
import { MembershipPayment } from "src/models/members/entities/membership-payment.entity";
import { EventAttendee, EventAttendeeType } from "../entities/event-attendee.entity";
import { getEventAccountingFunction } from "./event-accounting-function";

function attendee(type: EventAttendeeType, role: string | null, paidYears: number[]): EventAttendee {
	const member = {
		role,
		membership: paidYears.map((forYear) => ({ forYear }) as MembershipPayment),
	} as unknown as Member;
	return { type, role, member } as unknown as EventAttendee;
}

describe("getEventAccountingFunction", () => {
	it("marks event leaders as h", () => {
		expect(getEventAccountingFunction(attendee(EventAttendeeType.leader, "vedouci", [2026]), 2026)).toBe("h");
		expect(getEventAccountingFunction(attendee(EventAttendeeType.leader, "vedouci", []), 2026)).toBe("h");
	});

	it("marks attendees without the fee of the event's year as n", () => {
		expect(getEventAccountingFunction(attendee(EventAttendeeType.attendee, "dite", [2025]), 2026)).toBe("n");
	});

	it("keeps the role initial for paying attendees", () => {
		expect(getEventAccountingFunction(attendee(EventAttendeeType.attendee, "dite", [2026]), 2026)).toBe("d");
		expect(getEventAccountingFunction(attendee(EventAttendeeType.attendee, "instruktor", [2026]), 2026)).toBe("i");
	});

	it("returns undefined without a role", () => {
		expect(getEventAccountingFunction(attendee(EventAttendeeType.attendee, null, [2026]), 2026)).toBeUndefined();
	});
});
