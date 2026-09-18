import { Injectable } from "@nestjs/common";
import { DateTime } from "luxon";
import { currentMembershipYear, isMembershipPaid, membershipPaymentOf } from "src/helpers/membership";
import { getVariableSymbol } from "src/helpers/variable-symbol";
import { Schema } from "write-excel-file";
import writeXlsxFile from "write-excel-file/node";
import { Member } from "../entities/member.entity";
import { sortMemberContacts } from "../helpers/member-contacts";

@Injectable()
export class MembersExportService {
	constructor() {}

	async exportXlsx(members?: Member[]) {
		const contactMobiles = (member: Member) =>
			sortMemberContacts(member.contacts ?? [])
				.map((contact) => contact.mobile[0])
				.filter((mobile) => !!mobile);

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
				value: (member) => contactMobiles(member)[0],
			},
			{
				column: "Mobil matka",
				type: String,
				width: 15,
				value: (member) => contactMobiles(member)[1],
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

	/**
	 * The treasurer view as a sheet: one row per member, the columns the page shows by default and
	 * in the order it shows them, the rows in the order the caller handed them over. Everything is
	 * about one season, so the fee, the day it was recorded and the note are the ones of `year` —
	 * which is also what the variable symbol and the last column's header name.
	 */
	async exportMembershipXlsx(members: Member[], year: number = currentMembershipYear()) {
		const paymentOf = (member: Member) => membershipPaymentOf(member.membership, year);

		const schema: Schema<Member> = [
			{
				column: "VS",
				type: String,
				width: 12,
				align: "right",
				value: (member) => paymentOf(member)?.variableSymbol ?? getVariableSymbol(member, year),
			},
			{
				column: "Přezdívka",
				type: String,
				width: 20,
				fontWeight: "bold",
				value: (member) => member.nickname || member.firstName || undefined,
			},
			{
				column: "Jméno",
				type: String,
				width: 20,
				value: (member) => member.firstName || undefined,
			},
			{
				column: "Příjmení",
				type: String,
				width: 20,
				value: (member) => member.lastName || undefined,
			},
			{
				column: "Oddíl",
				type: String,
				width: 20,
				value: (member) => member.group?.name ?? member.group?.shortName,
			},
			{
				column: "Částka",
				type: Number,
				width: 12,
				align: "right",
				value: (member) => paymentOf(member)?.amount ?? undefined,
			},
			{
				column: "Datum platby",
				type: String,
				width: 15,
				align: "right",
				value: (member) => {
					const paidOn = paymentOf(member)?.paidOn;
					return paidOn ? DateTime.fromISO(paidOn).toFormat("d. M. yyyy") : undefined;
				},
			},
			{
				column: "Poznámka",
				type: String,
				width: 40,
				value: (member) => paymentOf(member)?.note ?? undefined,
			},
			{
				column: `Příspěvek ${year}`,
				type: String,
				width: 15,
				// The one question the sheet is about is answered the way it is answered everywhere.
				value: (member) => (isMembershipPaid(member.membership, year) ? "Zaplaceno" : "Nezaplaceno"),
			},
		];

		return writeXlsxFile<Member>(members, {
			schema,
			headerStyle: {
				fontWeight: "bold",
				align: "center",
			},
			sheet: `Příspěvky ${year}`,
			stickyRowsCount: 1,
			stickyColumnsCount: 2,
		});
	}
}
