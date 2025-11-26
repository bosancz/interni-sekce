// event-report.service.ts

import { ConsoleLogger, Injectable } from '@nestjs/common'; // <-- ADD THIS LINE
import { Console } from 'console';
import { EventAttendee } from 'src/models/events/entities/event-attendee.entity';
import { Event } from 'src/models/events/entities/event.entity';
import { Member } from 'src/models/members/entities/member.entity';
import * as xlsxPopulate from 'xlsx-populate';
import {string2Date} from '../../../helpers/string2date'

@Injectable() // <-- Now this will work
export class EventAnnouncementService {


    async generateAnnouncement(event: Event): Promise<{ fileBuffer: Buffer, fileName: string}> {
        

        const fileName = `Ohlaska_${(event.name).replace(" ", "_").normalize("NFD").replace(/[\u0300-\u036f]/g, "")}`
        const templatePath = "assets/annoucement_template.xlsx";

        const xlsx = await xlsxPopulate.fromFileAsync(templatePath);
        const annoucementSheet = xlsx.sheet("Ohláška");

        
        
        // Header
        annoucementSheet.cell("C15").value(event.name || "");
        annoucementSheet.range("C17:C17").value(string2Date(event.dateFrom) || "");
        annoucementSheet.range("C18:C18").value(string2Date(event.dateTill) || "");
        annoucementSheet.cell("C20").value(event.place || "");

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
        
        const attendeesString = event.attendees?.map(ea => {
 
            return [ 
            ea?.member?.firstName || missing,
            ea?.member?.lastName || missing,
            string2Date(ea?.member?.birthday) || missing,
            (ea?.member?.addressStreet || missing)+ " " + (ea?.member?.addressStreetNo || ""),
            ea?.member?.addressCity|| missing,
            ea?.member?.addressPostalCode || missing,
            (ea?.member?.contacts?.[0]?.mobile || missing) + " " + (ea?.member?.contacts?.[0]?.title ? ` (${ea.member.contacts[0].title})` : "")
            ];
             }) || [];

        attendeesString.sort((a, b) => {
            const dateA = a[2] !== missing ? new Date(String(b[2])).getTime() : 0;
            const dateB = b[2] !== missing ? new Date(String(b[2])).getTime() : 0;
            return dateA - dateB;
        });
        
        if (attendeesString.length > 0) {
            const startCol = 'A'
            const startRow = 32
            const endCol = String.fromCharCode(startCol.charCodeAt(0) + attendeesString[0].length);
            const endRow = startRow + attendeesString.length;
            annoucementSheet.range(`${startCol}${startRow}:${endCol}${endRow}`).value(attendeesString);
        }





        const fileBuffer = await xlsx.outputAsync("buffer") as Buffer;
        return({fileBuffer, fileName})

    }
}