import { Injectable } from "@nestjs/common"; // <-- ADD THIS LINE
import { Event } from "src/models/events/entities/event.entity";
import { Member } from "src/models/members/entities/member.entity";
import xlsxPopulate from "xlsx-populate";
import { estimateRichTextHeight, markdownToRichText } from "../../../helpers/markdown2richtext";
import { sanitizeFilename } from "../../../helpers/sanitizefilename";
import { string2Date } from "../../../helpers/string2date";
import { EventExpenseTypeTitles, EventExpenseTypes } from "../entities/event-expense.entity";

// Souhrn výdajů po kategoriích v listu "Soupis výdajů": šablona má popisky kategorií napevno
// ve sloupci H od řádku 12, součty patří vedle nich do sloupce I. Pořadí kategorií proto musí
// odpovídat popiskům v šabloně — při přidání kategorie je potřeba přidat řádek i tam.
const CATEGORY_SUMMARY_LABEL_COLUMN = "H";
const CATEGORY_SUMMARY_VALUE_COLUMN = "I";
const CATEGORY_SUMMARY_FIRST_ROW = 12;
const CATEGORY_SUMMARY_TYPES: EventExpenseTypes[] = [
	EventExpenseTypes.travelAllowance, // Cestovní náhrady
	EventExpenseTypes.transport, // Doprava
	EventExpenseTypes.material, // Materiál
	EventExpenseTypes.other, // Ostatní služby
	EventExpenseTypes.fuel, // PHM auto
	EventExpenseTypes.food, // Potraviny
	EventExpenseTypes.catering, // Stravování
	EventExpenseTypes.accommodation, // Ubytování
	EventExpenseTypes.admission, // Vstupné
];
const UNCATEGORIZED_LABEL = "Bez kategorie";

// Report se sází do jedné sloučené buňky (A10:J29 v listu "Report z akce"). Sloučená buňka si
// výšku podle obsahu nedopočítá, takže ji rozpočítáme mezi řádky bloku podle délky reportu.
const REPORT_CELL = "A10";
const REPORT_FIRST_ROW = 10;
const REPORT_LAST_ROW = 29;
// Šířka sloučené buňky (A + B:J) v jednotkách šířky sloupce, tedy zhruba počet znaků na řádek.
const REPORT_CHARS_PER_LINE = 110;
const REPORT_MIN_ROW_HEIGHT = 12.75;
// Excel výš než na 409,5 bodu řádek nepustí.
const REPORT_MAX_ROW_HEIGHT = 409.5;
// Základní písmo formuláře; bez něj by report vyšel patkovým výchozím písmem prohlížeče sešitu.
const REPORT_FONT = "Arial";

// Stejný formát jako sloupec s částkami účtenek, aby souhrn vypadal stejně jako soupis.
const AMOUNT_NUMBER_FORMAT = "#,##0.00\\ [$Kč-405];[RED]\\-#,##0.00\\ [$Kč-405]";

@Injectable() // <-- Now this will work
export class EventAccountingService {
	constructor() {
		// Inject other services you might need
	}

	async generateAccounting(event: Event): Promise<{ fileBuffer: Buffer; fileName: string }> {
		const fileName = `Uctovani_${sanitizeFilename(event.name)}.xlsx`;
		const templatePath = "assets/uctovani-v7.xlsx";
		const xlsx = await xlsxPopulate.fromFileAsync(templatePath);

		const attendeeSheet = xlsx.sheet("Seznam účastníků");
		const expenseSheet = xlsx.sheet("Soupis výdajů");
		const reportSheet = xlsx.sheet("Report z akce");

		// filling up memberssheet
		const leadersString =
			event?.leaders?.[0]?.firstName && event?.leaders?.[0]?.lastName
				? event.leaders[0].firstName + " " + event?.leaders[0].lastName
				: "";

		const attendeeMembers: Member[] = [
			...(event.attendees?.map((ea) => ea.member).filter((m): m is Member => !!m) || []),
		];
		const missing = "Chybí v DB";

		const attendeesString =
			event.attendees?.map((ea) => {
				return [
					ea?.member?.firstName || missing,
					ea?.member?.lastName || missing,
					string2Date(ea?.member?.birthday) || missing,
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
		attendeeSheet.range("B5:B5").value(string2Date(event.dateFrom) || "");
		attendeeSheet.range("B6:B6").value(string2Date(event.dateTill) || "");
		attendeeSheet.cell("B7").value(leadersString);

		if (attendeesString.length > 0) {
			const startCol = "A";
			const startRow = 19;
			const endCol = String.fromCharCode(startCol.charCodeAt(0) + attendeesString[0].length);
			const endRow = startRow + attendeesString.length;
			attendeeSheet.range(`${startCol}${startRow}:${endCol}${endRow}`).value(attendeesString);
		}

		const sortedExpenses =
			event.expenses?.sort((a, b) => {
				const idA = a.receiptNumber || "";
				const idB = b.receiptNumber || "";

				return idA.localeCompare(idB, "cs", { numeric: true });
			}) || [];

		const expensesString =
			sortedExpenses.map((exp) => {
				const typeTitle = (exp?.type != null && EventExpenseTypeTitles[exp.type]) || missing;

				return [
					exp?.receiptNumber || missing,
					exp?.description || missing,
					Number(exp?.amount) || missing,
					typeTitle,
				];
			}) || [];

		if (expensesString.length > 0) {
			const startCol = "B";
			const startRow = 11;
			const endCol = String.fromCharCode(startCol.charCodeAt(0) + expensesString[0].length);
			const endRow = startRow + expensesString.length;
			expenseSheet.range(`${startCol}${startRow}:${endCol}${endRow}`).value(expensesString);
		}

		// Souhrn po kategoriích vedle soupisu. Bez jediné účtenky ho necháme prázdný, stejně jako
		// zůstává prázdný soupis sám — devět nul by jen mátlo.
		if (sortedExpenses.length > 0) {
			const totalsByType = new Map<EventExpenseTypes, number>();
			// null = žádná účtenka bez kategorie, souhrn ten řádek pak vůbec nepotřebuje
			let uncategorizedTotal: number | null = null;

			for (const expense of sortedExpenses) {
				const amount = Number(expense?.amount) || 0;

				if (expense?.type != null) {
					totalsByType.set(expense.type, (totalsByType.get(expense.type) || 0) + amount);
				} else {
					uncategorizedTotal = (uncategorizedTotal || 0) + amount;
				}
			}

			CATEGORY_SUMMARY_TYPES.forEach((type, index) => {
				expenseSheet
					.cell(`${CATEGORY_SUMMARY_VALUE_COLUMN}${CATEGORY_SUMMARY_FIRST_ROW + index}`)
					.value(totalsByType.get(type) || 0)
					.style("numberFormat", AMOUNT_NUMBER_FORMAT);
			});

			// Účtenky bez kategorie by se jinak do souhrnu nezapočítaly a nesedělo by na celkové výdaje,
			// takže dostanou vlastní řádek hned pod kategoriemi ze šablony.
			if (uncategorizedTotal !== null) {
				const uncategorizedRow = CATEGORY_SUMMARY_FIRST_ROW + CATEGORY_SUMMARY_TYPES.length;

				expenseSheet.cell(`${CATEGORY_SUMMARY_LABEL_COLUMN}${uncategorizedRow}`).value(UNCATEGORIZED_LABEL);
				expenseSheet
					.cell(`${CATEGORY_SUMMARY_VALUE_COLUMN}${uncategorizedRow}`)
					.value(uncategorizedTotal)
					.style("numberFormat", AMOUNT_NUMBER_FORMAT);
			}
		}

		const reportRichText = markdownToRichText(event.report, { fontFamily: REPORT_FONT });

		// Prázdný rich text se do sešitu uloží jako prázdný sdílený řetězec (<si/>), přes který se
		// pak čtení souboru láme — akce bez reportu proto nechá buňku i její řádky beze změny.
		if (reportRichText.length > 0) {
			// range().value() accepts the RichText object (untyped `any`), unlike the stricter cell().value()
			reportSheet.range(`${REPORT_CELL}:${REPORT_CELL}`).value(reportRichText);

			const reportRows = REPORT_LAST_ROW - REPORT_FIRST_ROW + 1;
			// jeden řádek navíc jako rezerva, ať se poslední řádek reportu neschová pod okrajem buňky
			const reportHeight = estimateRichTextHeight(reportRichText, REPORT_CHARS_PER_LINE) + REPORT_MIN_ROW_HEIGHT;
			const reportRowHeight = Math.min(
				REPORT_MAX_ROW_HEIGHT,
				Math.max(REPORT_MIN_ROW_HEIGHT, Math.ceil(reportHeight / reportRows)),
			);

			for (let row = REPORT_FIRST_ROW; row <= REPORT_LAST_ROW; row++) {
				reportSheet.row(row).height(reportRowHeight);
			}
		}

		const fileBuffer = (await xlsx.outputAsync("buffer")) as Buffer;
		return { fileBuffer, fileName };
	}
}
