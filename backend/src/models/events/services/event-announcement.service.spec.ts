import { Config } from "src/config";
import { EventAttendee, EventAttendeeType } from "src/models/events/entities/event-attendee.entity";
import { Event } from "src/models/events/entities/event.entity";
import { MailService } from "src/models/mail/services/mail.service";
import { MemberContact } from "src/models/members/entities/member-contact.entity";
import { Member, MemberRoles } from "src/models/members/entities/member.entity";
import { EventAnnouncementService } from "./event-announcement.service";

const completeMember: Partial<Member> = {
	firstName: "Frodo",
	lastName: "Pytlík",
	birthday: "2014-09-22",
	addressStreet: "Dno pytle",
	addressStreetNo: "1",
	addressCity: "Hobitín",
	addressPostalCode: "123 45",
};

function attendee(
	id: number,
	member: Partial<Member>,
	options: { type?: EventAttendeeType; contacts?: Partial<MemberContact>[] } = {},
): EventAttendee {
	return {
		eventId: 1,
		memberId: id,
		type: options.type ?? EventAttendeeType.attendee,
		member: {
			id,
			nickname: `člen ${id}`,
			role: MemberRoles.dite,
			...completeMember,
			...member,
			contacts: (options.contacts ?? []) as MemberContact[],
		} as Member,
	} as EventAttendee;
}

const parentContact = { id: 1, isDefault: true, mobile: ["777 123 456"], relationship: "máma" };

function createService() {
	return new EventAnnouncementService({} as MailService, { announcements: { recipient: "lef@bosan.cz" } } as Config);
}

describe("EventAnnouncementService.getMissingData", () => {
	it("passes an event whose people are complete", () => {
		const event = {
			attendees: [
				attendee(1, {}, { contacts: [parentContact] }),
				attendee(2, { role: MemberRoles.vedouci, mobile: "603 000 000" }, { type: EventAttendeeType.leader }),
			],
		} as Event;

		expect(createService().getMissingData(event)).toEqual([]);
	});

	it("lists the missing fields per member", () => {
		const event = {
			attendees: [
				attendee(
					1,
					{ birthday: null, addressPostalCode: "" },
					{ contacts: [{ ...parentContact, mobile: [] }] },
				),
			],
		} as Event;

		expect(createService().getMissingData(event)).toEqual([
			{ memberId: 1, nickname: "člen 1", fields: ["datum narození", "telefon na rodiče"] },
		]);
	});

	it("takes a leader's own phone and falls back to the parent contact", () => {
		const service = createService();

		const withoutPhone = { attendees: [attendee(1, { role: MemberRoles.instruktor })] } as Event;
		expect(service.getMissingData(withoutPhone)[0].fields).toEqual(["telefon"]);

		const withContact = {
			attendees: [attendee(1, { role: MemberRoles.instruktor }, { contacts: [parentContact] })],
		} as Event;
		expect(service.getMissingData(withContact)).toEqual([]);
	});
});
