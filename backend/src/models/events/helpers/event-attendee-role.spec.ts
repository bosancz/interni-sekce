import { MemberRoles } from "src/models/members/schema/member-roles";
import { getAttendeeRoleByAge } from "./event-attendee-role";

const ages = { instructorFrom: 15, leaderFrom: 18 };

describe("getAttendeeRoleByAge", () => {
	it("returns dite under the instructor age", () => {
		expect(getAttendeeRoleByAge("2010-06-02", "2025-06-01", MemberRoles.vedouci, ages)).toBe(MemberRoles.dite);
	});

	it("returns instruktor from the instructor age on the birthday", () => {
		expect(getAttendeeRoleByAge("2010-06-01", "2025-06-01", MemberRoles.dite, ages)).toBe(MemberRoles.instruktor);
		expect(getAttendeeRoleByAge("2007-06-02", "2025-06-01", MemberRoles.dite, ages)).toBe(MemberRoles.instruktor);
	});

	it("returns vedouci from the leader age", () => {
		expect(getAttendeeRoleByAge("2007-06-01", "2025-06-01", MemberRoles.dite, ages)).toBe(MemberRoles.vedouci);
	});

	it("falls back without a birthday", () => {
		expect(getAttendeeRoleByAge(null, "2025-06-01", MemberRoles.instruktor, ages)).toBe(MemberRoles.instruktor);
	});
});
