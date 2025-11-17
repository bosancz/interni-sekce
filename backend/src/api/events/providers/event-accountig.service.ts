// event-report.service.ts

import { ConsoleLogger, Injectable } from '@nestjs/common'; // <-- ADD THIS LINE
import { Console } from 'console';
import e from 'express';
import { EventAttendee } from 'src/models/events/entities/event-attendee.entity';
import { Event } from 'src/models/events/entities/event.entity';
import { Member } from 'src/models/members/entities/member.entity';
import { InternalSymbolName } from 'typescript';
import * as xlsxPopulate from 'xlsx-populate';
@Injectable() // <-- Now this will work
export class EventAccountingService {
    constructor() {
        // Inject other services you might need
    }

    private string2date(stringDate: string|null|undefined): Date|null{
        if (!stringDate) return null;

        const date = new Date(stringDate);
        
        if (isNaN(date.getTime())) {
            return null;
        }
        return date;
    }


    async generateAccounting(event: Event): Promise<{ fileBuffer: Buffer, fileName: string}> {
        

        const fileName = `Uctovani_${(event.name).replace(" ", "_").normalize("NFD").replace(/[\u0300-\u036f]/g, "")}`
        const templatePath = "assets/uctovani-v6.xlsx";
        const xlsx = await xlsxPopulate.fromFileAsync(templatePath);

        
        const attendeeSheet = xlsx.sheet("Seznam účastníků");
        const expenseSheet = xlsx.sheet("Soupis výdajů")

        // filling up memberssheet
        const leadersString = event?.leaders?.[0]?.firstName && event?.leaders?.[0]?.lastName ? event.leaders[0].firstName+ " " + event?.leaders[0].lastName : "";

        const attendeeMembers: Member[] = [
            ...(event.attendees?.map(ea => ea.member).filter((m): m is Member => !!m) || []),
        ];
        const missing = "Chybí v DB";
        


        
    const attendeesString = event.attendees?.map(ea => {
        return [
            ea?.member?.firstName || missing,
            ea?.member?.lastName || missing,
            this.string2date(ea?.member?.birthday)|| missing,
            (ea?.member?.addressStreet || missing) + " " + (ea?.member?.addressStreetNo || ""),
            ea?.member?.addressCity || missing,
            ea?.member?.addressPostalCode || missing,
            ea?.member?.role?.charAt(0) || missing,           
        ];
        }) || [];

        attendeesString.sort((a, b) => {
            const dateA = a[2] !== missing ? new Date(String(a[2])).getTime() : 0;
            const dateB = b[2] !== missing ? new Date(String(b[2])).getTime() : 0;
            return dateA - dateB;
        });
        
        
        attendeeSheet.cell("A2").value(event.name || "");
        attendeeSheet.cell("B4").value(event.place || "");

        // ugly but its working .cell cant store Dateformat
        attendeeSheet.range("B5:B5").value(this.string2date(event.dateFrom) || "");
        attendeeSheet.range("B6:B6").value(this.string2date(event.dateTill) || "");
        attendeeSheet.cell("B7").value(leadersString);


        if (attendeesString.length > 0) {
            const startCol = 'A'
            const startRow = 19
            const endCol = String.fromCharCode(startCol.charCodeAt(0) + attendeesString[0].length);
            const endRow = startRow + attendeesString.length;
            attendeeSheet.range(`${startCol}${startRow}:${endCol}${endRow}`).value(attendeesString);

        }
        

        const sortedExpenses = event.expenses?.sort((a,b) => {
            const idA = a.receiptNumber || "";
            const idB = b.receiptNumber || "";

            return idA.localeCompare(idB, "cs", {numeric: true})
        }) || [];


        const expensesString = sortedExpenses.map(exp =>
            [exp?.receiptNumber || missing,
            exp?.description || missing,
            Number(exp?.amount) || missing,]
        ) || [];



        if (expensesString.length > 0) {
            const startCol = 'B'
            const startRow = 11
            const endCol = String.fromCharCode(startCol.charCodeAt(0) + expensesString[0].length);
            const endRow = startRow + expensesString.length;
            expenseSheet.range(`${startCol}${startRow}:${endCol}${endRow}`).value(expensesString);
        }
        
        console.log(expensesString)

        const fileBuffer = await xlsx.outputAsync("buffer") as Buffer;
        return({fileBuffer, fileName})

    }
}