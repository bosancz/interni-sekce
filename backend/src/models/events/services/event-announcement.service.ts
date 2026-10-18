import { Injectable } from "@nestjs/common";
import { Config } from "src/config";
import { sanitizeFilename } from "src/helpers/sanitizefilename";
import { EventAttendee, EventAttendeeType } from "src/models/events/entities/event-attendee.entity";
import { Event } from "src/models/events/entities/event.entity";
import { MailService } from "src/models/mail/services/mail.service";
import { getDefaultMemberContact } from "src/models/members/helpers/member-contacts";
import { Member, MemberRoles } from "src/models/members/entities/member.entity";
import xlsxPopulate from "xlsx-populate";
import { string2Date } from "../../../helpers/string2date";
import { getEventLeaders } from "../helpers/event-leaders";
import { EventAnnouncementMailTemplate } from "../mail-templates/event-announcement/event-announcement.mail-template";

export interface EventAnnouncementMissingData {
	memberId: number;
	nickname: string;
	fields: string[];
}

interface AnnouncementPhone {
	value: string | null;
	label: string;
}

const MISSING = "Chybí v DB";

const XLSX_CONTENT_TYPE = "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";

@Injectable()
export class EventAnnouncementService {
	constructor(
		private readonly mailService: MailService,
		private readonly config: Config,
	) {}

	get recipient() {
		return this.config.announcements.recipient;
	}

	getMissingData(event: Event): EventAnnouncementMissingData[] {
		return (event.attendees ?? [])
			.filter((attendee) => attendee.member)
			.map((attendee) => {
				const member = attendee.member!;
				const phone = this.getPhone(attendee);

				const fields = [
					!member.firstName && "jméno",
					!member.lastName && "příjmení",
					!string2Date(member.birthday) && "datum narození",
					!member.addressStreet && "ulice",
					!member.addressCity && "město",
					!member.addressPostalCode && "PSČ",
					!phone.value && phone.label,
				].filter((field): field is string => !!field);

				return { memberId: member.id, nickname: member.nickname, fields };
			})
			.filter((item) => item.fields.length)
			.sort((a, b) => a.nickname.localeCompare(b.nickname, "cs"));
	}

	async generateAnnouncement(event: Event): Promise<{ fileBuffer: Buffer; fileName: string }> {
		const fileName = `Ohlaska_${sanitizeFilename(event.name)}.xlsx`;
		const templatePath = "assets/annoucement_template.xlsx";

		const xlsx = await xlsxPopulate.fromFileAsync(templatePath);
		const annoucementSheet = xlsx.sheet("Ohláška");

		annoucementSheet.cell("B12").value(event.name || "");
		annoucementSheet.range("B14:B14").value(string2Date(event.dateFrom) || "");
		annoucementSheet.range("B15:B15").value(string2Date(event.dateTill) || "");
		annoucementSheet.cell("B17").value(event.place || "");
		if (event.meetingPlaceStart) annoucementSheet.cell("B18").value(event.meetingPlaceStart);
		if (event.meetingPlaceEnd) annoucementSheet.cell("B19").value(event.meetingPlaceEnd);

		const leaders = getEventLeaders(event.attendees);
		if (leaders.length) {
			const leadersString = (member: Member) =>
				member && member.firstName && member.lastName ? `${member.firstName} ${member.lastName}` : "";

			annoucementSheet.cell("B21").value(leadersString(leaders[0]));
		}

		const currentDate = new Date();
		annoucementSheet.range("F10:F10").value(currentDate);

		const attendeesString =
			event.attendees?.map((ea) => {
				const phone = this.getPhone(ea);

				return [
					ea?.member?.firstName || MISSING,
					ea?.member?.lastName || MISSING,
					string2Date(ea?.member?.birthday) || MISSING,
					(ea?.member?.addressStreet || MISSING) + " " + (ea?.member?.addressStreetNo || ""),
					ea?.member?.addressCity || MISSING,
					ea?.member?.addressPostalCode || MISSING,
					phone.value || MISSING,
				];
			}) || [];

		attendeesString.sort((a, b) => {
			const dateA = a[2] !== MISSING ? new Date(String(a[2])).getTime() : 0;
			const dateB = b[2] !== MISSING ? new Date(String(b[2])).getTime() : 0;
			return dateA - dateB;
		});

		if (attendeesString.length > 0) {
			const startCol = "A";
			const startRow = 25;
			const endCol = String.fromCharCode(startCol.charCodeAt(0) + attendeesString[0].length);
			const endRow = startRow + attendeesString.length;
			annoucementSheet.range(`${startCol}${startRow}:${endCol}${endRow}`).value(attendeesString);
		}

		const fileBuffer = (await xlsx.outputAsync("buffer")) as Buffer;
		return { fileBuffer, fileName };
	}

	async sendAnnouncement(event: Event, options: { sender: string; replyTo?: string | null }) {
		const { fileBuffer, fileName } = await this.generateAnnouncement(event);

		const leaders = getEventLeaders(event.attendees)
			.map((member) => member.nickname)
			.join(", ");

		const mail = EventAnnouncementMailTemplate(this.recipient, {
			sender: options.sender,
			eventName: event.name,
			dates: this.formatDates(event.dateFrom, event.dateTill),
			place: event.place || undefined,
			leaders: leaders || undefined,
			attendeesCount: event.attendees?.length ?? 0,
			url: `${this.config.app.baseUrl}/akce/${event.id}`,
			resent: !!event.announcementSentAt,
		});

		await this.mailService.sendMail({
			...mail,
			replyTo: options.replyTo || undefined,
			attachments: [{ filename: fileName, contentType: XLSX_CONTENT_TYPE, content: fileBuffer }],
		});
	}

	private getPhone(attendee: EventAttendee): AnnouncementPhone {
		const member = attendee.member;
		const contact = getDefaultMemberContact(member?.contacts);
		const contactPhone = contact?.mobile?.length
			? contact.mobile.join(", ") + (contact.relationship ? ` (${contact.relationship})` : "")
			: null;

		const isAdult =
			attendee.type === EventAttendeeType.leader ||
			member?.role === MemberRoles.vedouci ||
			member?.role === MemberRoles.instruktor;

		if (isAdult) {
			const ownPhone = member?.mobile?.trim();
			return { value: ownPhone ? `${ownPhone} (vlastní)` : contactPhone, label: "telefon" };
		}

		return { value: contactPhone, label: "telefon na rodiče" };
	}

	private formatDates(dateFrom: string, dateTill: string) {
		const format = (date: string) =>
			new Intl.DateTimeFormat("cs-CZ", {
				timeZone: "UTC",
				day: "numeric",
				month: "numeric",
				year: "numeric",
			}).format(new Date(date));

		return dateFrom === dateTill ? format(dateFrom) : `${format(dateFrom)} – ${format(dateTill)}`;
	}
}
