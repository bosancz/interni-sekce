import { BadRequestException, Injectable } from "@nestjs/common";
import { marked, Token, Tokens } from "marked";
import * as path from "path";
import type { Content, TableCell, TDocumentDefinitions } from "pdfmake/interfaces";
import { LeadersDeleteColumn1690377300739 } from "src/database/migrations/1690377300739-leaders-delete-column";
import { string2Date } from "src/helpers/string2date";
import { Event } from "src/models/events/entities/event.entity";
import { Member } from "src/models/members/entities/member.entity";

// pdfmake's server-side printer is not typed by @types/pdfmake (which only covers the browser build).
/* eslint-disable @typescript-eslint/no-var-requires */
const PdfPrinter = require("pdfmake/js/Printer").default;
const URLResolver = require("pdfmake/js/URLResolver").default;
const virtualFs = require("pdfmake/js/virtual-fs").default;
/* eslint-enable @typescript-eslint/no-var-requires */

const FONTS_DIR = path.resolve("assets/fonts");

const fonts = {
	// Body font (Czech diacritics supported), bundled with pdfmake.
	Roboto: {
		normal: path.join(FONTS_DIR, "Roboto-Regular.ttf"),
		bold: path.join(FONTS_DIR, "Roboto-Medium.ttf"),
		italics: path.join(FONTS_DIR, "Roboto-Italic.ttf"),
		bolditalics: path.join(FONTS_DIR, "Roboto-MediumItalic.ttf"),
	},
	// Brand headline font (regular weight only).
	SanGrotesk: {
		normal: path.join(FONTS_DIR, "SanGrotesk-Regular.otf"),
		bold: path.join(FONTS_DIR, "SanGrotesk-Regular.otf"),
		italics: path.join(FONTS_DIR, "SanGrotesk-Regular.otf"),
		bolditalics: path.join(FONTS_DIR, "SanGrotesk-Regular.otf"),
	},
};

// Colors taken from the LaTeX template.
const PASTEL_ORANGE = "#E28F26";
const PASTEL_BLUE = "#2A3478";
const BORDER_GRAY = "#a0a0a0";
const BOX_FILL = "#f5f5f5";

// Standard credit card (ISO/IEC 7810 ID-1): 85.6 mm × 53.98 mm, in PDF points (1 mm ≈ 2.83465 pt).
const MM_TO_PT = 2.83465;
const CARD_WIDTH = Math.round(85.6 * MM_TO_PT); // ≈ 243
const CARD_HEIGHT = Math.round(53.98 * MM_TO_PT); // ≈ 153

@Injectable()
export class EventRegistrationService {
	async generateRegistration(event: Event): Promise<Buffer> {
		this.assertGeneratable(event);

		const urlResolver = new URLResolver(virtualFs);
		const printer = new PdfPrinter(fonts, virtualFs, urlResolver, () => true);
		const pdfDoc = await printer.createPdfKitDocument(this.buildDocDefinition(event));

		return await new Promise<Buffer>((resolve, reject) => {
			const chunks: Buffer[] = [];
			pdfDoc.on("data", (chunk: Buffer) => chunks.push(chunk));
			pdfDoc.on("end", () => resolve(Buffer.concat(chunks)));
			pdfDoc.on("error", reject);
			pdfDoc.end();
		});
	}

	/** Refuses generation when the data the form relies on is missing, listing exactly what. */
	private assertGeneratable(event: Event): void {
		const missing: string[] = [];
		if (!event.name?.trim()) missing.push("název akce");
		if (!event.place?.trim()) missing.push("místo");
		if (!event.meetingPlaceStart?.trim()) missing.push("místo odjezdu");
		if (!event.meetingPlaceEnd?.trim()) missing.push("místo příjezdu");
		if (!event.leaders?.[0]?.mobile?.trim()) missing.push("mobil na vedoucího");
		if (!event.leaders?.[0]?.email?.trim()) missing.push("email na vedoucího");


		if (missing.length) {
			throw new BadRequestException(`Nelze vygenerovat přihlášku, chybí: ${missing.join(", ")}.`);
		}
	}

	private buildDocDefinition(event: Event): TDocumentDefinitions {
		return {
			pageSize: "A4",
			pageOrientation: "landscape",
			pageMargins: [40, 36, 40, 40],
			defaultStyle: { font: "Roboto", fontSize: 10, lineHeight: 1.15 },
			content: [
				{
					columns: [
						{ width: "*", stack: this.buildInfoColumn(event) },
						{ width: 24, text: "" },
						{ width: "*", stack: this.buildFormColumn() },
					],
				},
			],
		};
	}

	private buildInfoColumn(event: Event): Content[] {
		return [
			{
				text: event.name || "",
				font: "SanGrotesk",
				fontSize: 22,
				color: PASTEL_ORANGE,
				alignment: "center",
				margin: [0, 0, 0, 10],
			},
			...(event.description ? this.markdownToContent(event.description) : []),
			{
				table: {
					widths: ["*"],
					body: [[{ stack: this.buildInfoLines(event), fillColor: BOX_FILL, margin: [6, 6, 6, 6] }]],
				},
				layout: {
					hLineWidth: () => 0.5,
					vLineWidth: () => 0.5,
					hLineColor: () => BORDER_GRAY,
					vLineColor: () => BORDER_GRAY,
				},
				margin: [0, 4, 0, 0],
			},
		];
	}

	private buildInfoLines(event: Event): Content[] {
		return [
			this.infoLine("Místo:", event.place || ""),
			this.infoLine("Odjezd:", this.formatDeparture(event.dateFrom, event.timeFrom, event.meetingPlaceStart)),
			this.infoLine("Příjezd:", this.formatDeparture(event.dateTill, event.timeTill, event.meetingPlaceEnd)),
			this.infoLineBlank("Cena:"),
			this.infoLineBlank("Co s sebou:"),
			this.infoLine("Kontakt:", this.formatContacts(event.leaders)),
		];
	}

	private infoLine(label: string, value: string): Content {
		return {
			text: [{ text: `${label} `, bold: true }, value],
			margin: [0, 1, 0, 1],
		};
	}

	private infoLineBlank(label: string): Content {
		return {
			text: [{ text: `${label} `, bold: true }, this.blankLine(95)],
			margin: [0, 1, 0, 1],
		};
	}

	private buildFormColumn(): Content[] {
		return [
			{
				text: "Přihláška",
				font: "SanGrotesk",
				fontSize: 22,
				alignment: "center",
				margin: [0, 0, 0, 4],
			},
			{
				canvas: [{ type: "line", x1: 0, y1: 0, x2: 360, y2: 0, lineWidth: 0.5, lineColor: BORDER_GRAY }],
				margin: [0, 0, 0, 12],
			},
			this.buildFormFields(),
			this.buildInsuranceCardBox(),
			{
				text:
					"Podpisem prohlašuji, že lékař dítěti nenařídil změnu režimu, dítě nejeví známky akutního " +
					"onemocnění. Dítě je schopno zúčastnit se akce.",
				margin: [0, 0, 0, 16],
			},
			this.buildSignatureRow(),
		];
	}

	/** Form fields whose answer is a full-width line (drawn as a bottom cell border) for hand fill-in. */
	private buildFormFields(): Content {
		const lineCell = (): TableCell => ({ text: " ", border: [false, false, false, true] });
		const labelCell = (label: string): TableCell => ({ text: label, bold: true, border: [false, false, false, false] });
		const row = (label: string): TableCell[] => [labelCell(label), lineCell()];

		return {
			table: {
				widths: ["auto", "*"],
				body: [
					row("Jméno a příjmení dítěte:"),
					row("Datum narození:"),
					row("Kontakt rodiče (mobil):"),
					row("Kontakt rodiče (e-mail):"),
					row("Bydliště:"),
					row("Zdravotní komplikace:"),
				],
			},
			layout: {
				defaultBorder: false,
				hLineWidth: () => 0.6,
				hLineColor: () => BORDER_GRAY,
				vLineWidth: () => 0,
				paddingTop: () => 8,
				paddingBottom: () => 4,
			},
		};
	}

	/** Empty box sized like a standard credit card, centered, for the insurance card copy. */
	private buildInsuranceCardBox(): Content {
		const box: Content = {
			table: {
				widths: [CARD_WIDTH],
				heights: [CARD_HEIGHT],
				body: [
					[
						{
							text: "(Kopie kartičky pojištěnce)",
							alignment: "center",
							color: BORDER_GRAY,
							margin: [0, CARD_HEIGHT / 2 - 8, 0, 0],
						},
					],
				],
			},
			layout: {
				hLineWidth: () => 0.5,
				vLineWidth: () => 0.5,
				hLineColor: () => BORDER_GRAY,
				vLineColor: () => BORDER_GRAY,
			},
		};

		return {
			columns: [{ width: "*", text: "" }, { width: CARD_WIDTH, stack: [box] }, { width: "*", text: "" }],
			margin: [0, 18, 0, 18],
		};
	}

	private buildSignatureRow(): Content {
		const lineCell = (): TableCell => ({ text: " ", border: [false, false, false, true] });
		const labelCell = (label: string): TableCell => ({ text: label, bold: true, border: [false, false, false, false] });

		return {
			table: {
				widths: ["auto", "*", "auto", "*"],
				body: [[labelCell("Podpis:"), lineCell(), labelCell("Datum:"), lineCell()]],
			},
			layout: {
				defaultBorder: false,
				hLineWidth: () => 0.6,
				hLineColor: () => BORDER_GRAY,
				vLineWidth: () => 0,
				paddingTop: () => 6,
			},
		};
	}

	/** An empty underlined run, used as a hand fill-in line inside flowing text. */
	private blankLine(length: number): Content {
		return { text: " ".repeat(length), decoration: "underline", decorationColor: BORDER_GRAY };
	}

	// ---- Markdown rendering ----------------------------------------------------

	private markdownToContent(md: string): Content[] {
		const content: Content[] = [];

		for (const token of marked.lexer(md)) {
			switch (token.type) {
				case "heading":
					content.push({
						text: this.inlineToContent((token as Tokens.Heading).tokens),
						bold: true,
						fontSize: token.depth <= 2 ? 13 : 11,
						margin: [0, 4, 0, 2],
					});
					break;
				case "paragraph":
					content.push({ text: this.inlineToContent((token as Tokens.Paragraph).tokens), margin: [0, 0, 0, 6] });
					break;
				case "blockquote":
					content.push({
						text: this.inlineToContent((token as Tokens.Blockquote).tokens),
						italics: true,
						margin: [8, 0, 0, 6],
					});
					break;
				case "list": {
					const items = (token as Tokens.List).items.map((item) => ({ text: this.inlineToContent(item.tokens) }));
					content.push((token as Tokens.List).ordered ? { ol: items, margin: [0, 0, 0, 6] } : { ul: items, margin: [0, 0, 0, 6] });
					break;
				}
				case "space":
					break;
				default: {
					const text = (token as Tokens.Generic).text;
					if (text) content.push({ text, margin: [0, 0, 0, 6] });
				}
			}
		}

		return content;
	}

	private inlineToContent(tokens: Token[] | undefined): Content {
		if (!tokens) return "";

		return tokens.map((token): Content => {
			switch (token.type) {
				case "strong":
					return { text: this.inlineToContent((token as Tokens.Strong).tokens), bold: true };
				case "em":
					return { text: this.inlineToContent((token as Tokens.Em).tokens), italics: true };
				case "del":
					return { text: this.inlineToContent((token as Tokens.Del).tokens), decoration: "lineThrough" };
				case "link":
					return { text: this.inlineToContent((token as Tokens.Link).tokens), color: PASTEL_BLUE, decoration: "underline" };
				case "codespan":
					return (token as Tokens.Codespan).text;
				case "br":
					return "\n";
				case "text": {
					const t = token as Tokens.Text;
					return t.tokens ? { text: this.inlineToContent(t.tokens) } : t.text;
				}
				default:
					return (token as Tokens.Generic).text ?? "";
			}
		});
	}

	// ---- Value formatting ------------------------------------------------------

	private formatDate(date: string | null | undefined): string {
		const d = string2Date(date);
		return d ? `${d.getDate()}. ${d.getMonth() + 1}. ${d.getFullYear()}` : "";
	}

	private formatDeparture(date: string | null, time: string | null, place: string | null): string {
		return [this.formatDate(date), time, place].filter(Boolean).join(" ");
	}

	private formatContacts(leaders: Member[] | undefined): string {
		return (leaders || [])
			.map((member) => {
				const name = [member.firstName,( "\"" + member.nickname +  "\""|| ""), member.lastName].filter(Boolean).join(" ");
				const phone = member.mobile;
				const email =  member.email;
				const contact = [phone, email].filter(Boolean).join(", ");
				return [name, contact].filter(Boolean).join(" – ");
			})
			.filter(Boolean)
			.join("\n");
	}
}
