import { Injectable } from "@nestjs/common";
import { DateTime } from "luxon";
import { Schema } from "write-excel-file";
import writeXlsxFile from "write-excel-file/node";
import { Member } from "../entities/member.entity";

@Injectable()
export class MembersExportService {
	constructor() {}

	async exportXlsx(members?: Member[]) {
		const schema: Schema<Member> = [
			{
				column: "Oddíl",
				type: String,
				value: (member) => member.group?.name,
			},
			{
				column: "Přezdívka",
				type: String,
				value: (member) => member.nickname,
				fontWeight: "bold",
			},
			{
				column: "Jméno",
				type: String,
				value: (member) => member.firstName,
			},
			{
				column: "Příjmení",
				type: String,
				value: (member) => member.lastName,
			},
			{
				column: "Datum narození",
				type: String,
				width: 15,
				align: "right",
				value: (member) =>
					member.birthday ? DateTime.fromISO(member.birthday).toFormat("d. M. yyyy") : undefined,
			},
			{
				column: "Ulice a č. domu",
				type: String,
				width: 20,
				value: (member) =>
					[member.addressStreet, member.addressStreetNo].filter((element) => element).join(" "),
			},
			{
				column: "Obec",
				type: String,
				width: 20,
				value: (member) => member.addressCity,
			},
			{
				column: "PSČ",
				type: String,
				value: (member) => member.addressPostalCode,
			},
			{
				column: "Mobil otec",
				type: String,
				width: 15,
				value: (member) => member.contacts?.filter((c) => c.mobile)[0]?.mobile,
			},
			{
				column: "Mobil matka",
				type: String,
				width: 15,
				value: (member) => member.contacts?.filter((c) => c.mobile)[1]?.mobile,
			},
			{
				column: "E-mail",
				type: String,
				width: 15,
				value: (member) => member.email,
			},
			{
				column: "Mobil",
				type: String,
				width: 15,
				value: (member) => member.mobile,
			},
		];

		return writeXlsxFile<Member>(members!, {
			schema,
			headerStyle: {
				fontWeight: "bold",
				align: "center",
			},
			sheet: "Členská databáze",
			stickyRowsCount: 1,
			stickyColumnsCount: 2,
		});
	}
}
