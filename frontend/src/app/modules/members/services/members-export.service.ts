import { Member } from "../../../schema/member";
import writeXlsxFile, { Schema } from "write-excel-file";
import { MemberGroups } from "../../../config/member-groups";
import { DatePipe } from "@angular/common";
import { Injectable } from "@angular/core";

@Injectable({
  providedIn: "root"
})
export class MembersExportService {

  constructor(
    private datePipe: DatePipe
  ) {
  }

  async export(members?: Member[]) {
    const schema: Schema<Member> = [
      {
        column: "Oddíl",
        type: String,
        value: member => MemberGroups[member.group]?.name || undefined
      },
      {
        column: "Přezdívka",
        type: String,
        value: member => member.nickname,
        fontWeight: "bold"
      },
      {
        column: "Jméno",
        type: String,
        value: member => member.name?.first
      },
      {
        column: "Příjmení",
        type: String,
        value: member => member.name?.last
      },
      {
        column: "Datum narození",
        type: String,
        width: 15,
        align: "right",
        value: member => this.datePipe.transform(member.birthday, "d. M. yyyy") || undefined
      },
      {
        column: "Ulice a č. domu",
        type: String,
        width: 20,
        value: member => [member.address?.street, member.address?.streetNo].filter(element => element).join(" ")
      },
      {
        column: "Obec",
        type: String,
        width: 20,
        value: member => member.address?.city
      },
      {
        column: "PSČ",
        type: String,
        value: member => member.address?.postalCode
      },
      {
        column: "Mobil otec",
        type: String,
        width: 15,
        value: member => member.contacts?.father
      },
      {
        column: "Mobil matka",
        type: String,
        width: 15,
        value: member => member.contacts?.mother
      },
      {
        column: "E-mail",
        type: String,
        width: 15,
        value: member => member.contacts?.email
      },
      {
        column: "Mobil",
        type: String,
        width: 15,
        value: member => member.contacts?.mobile
      }
    ];

    await writeXlsxFile<Member>(
      members!,
      {
        schema,
        headerStyle: {
          fontWeight: "bold",
          align: "center"
        },
        sheet: "Členská databáze",
        stickyRowsCount: 1,
        stickyColumnsCount: 2,
        fileName: "export.xlsx"
      });
  }
}
