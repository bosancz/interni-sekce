// event-report.service.ts

import { ConsoleLogger, Injectable } from '@nestjs/common'; // <-- ADD THIS LINE
import { Console } from 'console';
import { EventAttendee } from 'src/models/events/entities/event-attendee.entity';
import { Event } from 'src/models/events/entities/event.entity';
import { Member } from 'src/models/members/entities/member.entity';
import * as xlsxPopulate from 'xlsx-populate';
@Injectable() // <-- Now this will work
export class EventAnnouncementService {
    constructor() {
        // Inject other services you might need
    }

    async generateAnnouncement(event: Event): Promise<{ fileBuffer: Buffer, fileName: string}> {
        

        const fileName = `Ohlaska_${(event.name).replace(" ", "_").normalize("NFD").replace(/[\u0300-\u036f]/g, "")}`
        const templatePath = "assets/annoucement_template.xlsx";

        const xlsx = await xlsxPopulate.fromFileAsync(templatePath);
        const annoucementSheet = xlsx.sheet("Ohláška");

        
        
        // Header
        annoucementSheet.cell("C15").value(event.name || "");
        if (event.dateFrom) annoucementSheet.cell("C17").value(event.dateFrom);
        if (event.dateTill) annoucementSheet.cell("C18").value(event.dateTill);
        if (event.place) annoucementSheet.cell("C18").value(event.place);

        if (event.leaders){
            const leadersString = (member: Member) => member && member.firstName && member.lastName ? `${member.firstName} ${member.lastName}`: "";
            
            annoucementSheet.cell("C22").value(leadersString(event.leaders[0]));
            annoucementSheet.cell("C23").value(leadersString(event.leaders[1] || event.leaders[0]));
            annoucementSheet.cell("C24").value(leadersString(event.leaders[2] || event.leaders[1] || event.leaders[0]));
        }



        if (event.meetingPlaceStart) annoucementSheet.cell("C26").value(event.meetingPlaceStart);
        if (event.meetingPlaceEnd) annoucementSheet.cell("C27").value(event.meetingPlaceEnd);

        const currentDate = new Date().toLocaleDateString('cs-CZ');
        annoucementSheet.cell("F11").value(currentDate)

        
        const attendeeMembers: Member[] = [
            ...(event.attendees?.map(ea => ea.member).filter((m): m is Member => !!m) || []),
        ];

        const missing = "Chybí v DB";
        
        const attendees = event.attendees?.map(ea => [
            ea?.member?.firstName || missing,
            ea?.member?.lastName || missing,
            ea?.member?.birthday || missing,
            (ea?.member?.addressStreet || missing)+ " " + (ea?.member?.addressStreetNo || ""),
            ea?.member?.addressCity|| missing,
            ea?.member?.addressPostalCode || missing,
            (ea?.member?.contacts?.[0]?.mobile || missing) + " " + (ea?.member?.contacts?.[0]?.title ? ` (${ea.member.contacts[0].title})` : "")

            
            ]) || [];
            
        //attendees.sort((a,b) => a[2].localeCompare(b[2]));
        console.log(attendees)
        
        if (attendees.length > 0) {
            const endRow = 31 + attendees.length;
            const endCol = String.fromCharCode(64 + 7); // 'G' for 7 columns
            annoucementSheet.range(`A32:${endCol}${endRow}`).value(attendees);
        }





        const fileBuffer = await xlsx.outputAsync("buffer") as Buffer;
        return({fileBuffer, fileName})

    }
}