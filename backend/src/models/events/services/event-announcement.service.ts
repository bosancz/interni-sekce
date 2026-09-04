import { Injectable } from "@nestjs/common";
import { sanitizeFilename } from "src/helpers/sanitizefilename";
import { Event } from "src/models/events/entities/event.entity";
import { getDefaultMemberContact } from "src/models/members/helpers/member-contacts";
import { Member } from "src/models/members/entities/member.entity";
import xlsxPopulate from "xlsx-populate";
import { string2Date } from "../../../helpers/string2date";

@Injectable()
export class EventAnnouncementService {
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

		if (event.leaders) {
			const leadersString = (member: Member) =>
				member && member.firstName && member.lastName ? `${member.firstName} ${member.lastName}` : "";

			annoucementSheet.cell("B21").value(leadersString(event.leaders[0]));
		}

		const currentDate = new Date();
		annoucementSheet.range("F10:F10").value(currentDate);

		const attendeeMembers: Member[] = [
			...(event.attendees?.map((ea) => ea.member).filter((m): m is Member => !!m) || []),
		];

		const missing = "Chybí v DB";

		const attendeesString =
			event.attendees?.map((ea) => {
				const contact = getDefaultMemberContact(ea?.member?.contacts);

				return [
					ea?.member?.firstName || missing,
					ea?.member?.lastName || missing,
					string2Date(ea?.member?.birthday) || missing,
					(ea?.member?.addressStreet || missing) + " " + (ea?.member?.addressStreetNo || ""),
					ea?.member?.addressCity || missing,
					ea?.member?.addressPostalCode || missing,
					(contact?.mobile?.join(", ") || missing) +
						" " +
						(contact?.relationship ? ` (${contact.relationship})` : ""),
				];
			}) || [];

		attendeesString.sort((a, b) => {
			const dateA = a[2] !== missing ? new Date(String(a[2])).getTime() : 0;
			const dateB = b[2] !== missing ? new Date(String(b[2])).getTime() : 0;
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
}
