import { Injectable } from "@nestjs/common";
import * as Handlebars from "handlebars";
import { readFile, unlink, writeFile } from "fs/promises";
import { DateTime } from "luxon";
import { tmpdir } from "os";
import * as path from "path";
import * as puppeteer from "puppeteer";
import { pathToFileURL } from "url";
import xlsxPopulate from "xlsx-populate";
import { resolveChromiumPath } from "src/helpers/chromium";
import { Event, EventStates } from "src/models/events/entities/event.entity";
import { renderProgramDocx } from "../helpers/program-docx";

const TEMPLATE_FILE = path.resolve("assets/program-template/template.html");
const FONTS_DIR = path.resolve("assets/fonts");
const LOGO_FILE = path.resolve("assets/img/sanlogo-07.svg");

const ZONE = "Europe/Prague";

export const PROGRAM_STATUS_LABELS: Record<string, string> = {
	[EventStates.draft]: "Připravovaná",
	[EventStates.pending]: "Čeká na schválení",
	[EventStates.rejected]: "Vrácená k úpravám",
	[EventStates.public]: "V programu",
	[EventStates.cancelled]: "Zrušená",
};

export enum ProgramExportFormats {
	pdf = "pdf",
	docx = "docx",
	xlsx = "xlsx",
}

const CONTENT_TYPES: Record<ProgramExportFormats, string> = {
	[ProgramExportFormats.pdf]: "application/pdf",
	[ProgramExportFormats.docx]: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
	[ProgramExportFormats.xlsx]: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
};

export interface ProgramExportFilter {
	year?: number[];
	dateFrom?: string;
	dateTill?: string;
	status?: string[];
	search?: string;
	my?: boolean;
	noleader?: boolean;
}

export interface ProgramExportFile {
	buffer: Buffer;
	contentType: string;
	fileName: string;
}

export interface ProgramEventContext {
	name: string;
	dateLabel: string;
	weekdayLabel: string;
	place?: string | null;
	leaders: string[];
	groups: { shortName: string; color: string }[];
	status: string | null;
	statusClass: string;
	cancelled: boolean;
}

export interface ProgramContext {
	subtitle: string;
	generatedAt: string;
	countLabel: string;
	months: { label: string; events: ProgramEventContext[] }[];
}

@Injectable()
export class EventsProgramExportService {
	private template?: HandlebarsTemplateDelegate;

	async renderProgram(
		events: Event[],
		filter: ProgramExportFilter,
		format: ProgramExportFormats,
	): Promise<ProgramExportFile> {
		const buffer = await this.render(events, filter, format);
		return { buffer, contentType: CONTENT_TYPES[format], fileName: `program.${format}` };
	}

	private render(events: Event[], filter: ProgramExportFilter, format: ProgramExportFormats) {
		switch (format) {
			case ProgramExportFormats.docx:
				return renderProgramDocx(this.buildContext(events, filter), {
					fontsDir: path.join(FONTS_DIR, "docx"),
					logoFile: LOGO_FILE,
				});
			case ProgramExportFormats.xlsx:
				return this.renderXlsx(events);
			default:
				return this.renderPdf(events, filter);
		}
	}

	private async renderPdf(events: Event[], filter: ProgramExportFilter): Promise<Buffer> {
		const template = await this.getTemplate();
		const html = template({
			...this.buildContext(events, filter),
			fontsUrl: pathToFileURL(FONTS_DIR).href,
			logoUrl: pathToFileURL(LOGO_FILE).href,
		});

		const tempFile = path.join(tmpdir(), `program-${Date.now()}-${Math.random().toString(36).slice(2)}.html`);
		let browser: puppeteer.Browser | undefined;

		try {
			await writeFile(tempFile, html, "utf-8");

			browser = await puppeteer.launch({
				executablePath: resolveChromiumPath(),
				args: ["--no-sandbox", "--disable-setuid-sandbox"],
			});

			const page = await browser.newPage();
			await page.goto(pathToFileURL(tempFile).href, { waitUntil: "networkidle0" });

			const pdf = await page.pdf({
				format: "A4",
				printBackground: true,
				displayHeaderFooter: true,
				headerTemplate: "<span></span>",
				footerTemplate: this.footerTemplate(),
				margin: { top: "14mm", bottom: "16mm", left: "14mm", right: "14mm" },
			});

			return Buffer.from(pdf);
		} finally {
			await browser?.close().catch(() => undefined);
			await unlink(tempFile).catch(() => undefined);
		}
	}

	private async renderXlsx(events: Event[]): Promise<Buffer> {
		const workbook = await xlsxPopulate.fromBlankAsync();
		const sheet = workbook.sheet(0).name("Program");

		const header = ["Název", "Datum", "Stav", "Vedoucí"];
		const rows = events.map((event) => [
			event.name,
			this.tableDateLabel(event.dateFrom, event.dateTill),
			PROGRAM_STATUS_LABELS[event.status] ?? event.status,
			this.leaderNames(event).join(", "),
		]);

		sheet.range(1, 1, rows.length + 1, header.length).value([header, ...rows]);
		sheet.range(1, 1, 1, header.length).style({ bold: true, fill: "e4e7ef", border: { bottom: true } });
		if (rows.length) sheet.range(1, 1, rows.length + 1, header.length).autoFilter();
		sheet.freezePanes(0, 1);

		[48, 28, 20, 40].forEach((width, index) => sheet.column(index + 1).width(width));

		return workbook.outputAsync() as Promise<Buffer>;
	}

	private async getTemplate() {
		if (!this.template) this.template = Handlebars.compile(await readFile(TEMPLATE_FILE, "utf-8"));
		return this.template;
	}

	private footerTemplate() {
		const style =
			"font-family: 'Helvetica Neue', Arial, sans-serif; font-size: 8px; color: #8a8fa3; width: 100%; padding: 0 14mm; display: flex; justify-content: space-between;";
		return `<div style="${style}"><span>Interní sekce ŠÁN · Program akcí</span><span><span class="pageNumber"></span> / <span class="totalPages"></span></span></div>`;
	}

	private buildContext(events: Event[], filter: ProgramExportFilter): ProgramContext {
		const sorted = [...events].sort(
			(a, b) => a.dateFrom.localeCompare(b.dateFrom) || a.dateTill.localeCompare(b.dateTill) || a.id - b.id,
		);

		const months: ProgramContext["months"] = [];
		for (const event of sorted) {
			const label = this.capitalize(this.date(event.dateFrom).toFormat("LLLL yyyy"));
			let month = months[months.length - 1];
			if (month?.label !== label) {
				month = { label, events: [] };
				months.push(month);
			}
			month.events.push(this.eventContext(event));
		}

		return {
			subtitle: this.describeFilter(filter),
			generatedAt: DateTime.now().setZone(ZONE).toFormat("d. M. yyyy"),
			countLabel: `${events.length} ${this.pluralEvents(events.length)}`,
			months,
		};
	}

	private eventContext(event: Event): ProgramEventContext {
		const status =
			event.status !== EventStates.public ? (PROGRAM_STATUS_LABELS[event.status] ?? event.status) : null;

		return {
			name: event.name,
			...this.dateLabels(event.dateFrom, event.dateTill),
			place: event.place,
			leaders: this.leaderNames(event),
			groups: (event.groups ?? [])
				.map((group) => ({ shortName: group.shortName, color: group.color || "#6b7185" }))
				.sort((a, b) => a.shortName.localeCompare(b.shortName, "cs")),
			status,
			statusClass: event.status,
			cancelled: event.status === EventStates.cancelled,
		};
	}

	private leaderNames(event: Event): string[] {
		return (event.leaders ?? []).map((leader) => leader.nickname || leader.firstName).filter(Boolean) as string[];
	}

	private tableDateLabel(dateFrom: string, dateTill: string) {
		return `${this.date(dateFrom).toFormat("ccc d. M.")} – ${this.date(dateTill).toFormat("ccc d. M. yyyy")}`;
	}

	private dateLabels(dateFrom: string, dateTill: string) {
		const from = this.date(dateFrom);
		const till = this.date(dateTill);

		if (from.hasSame(till, "day")) {
			return { dateLabel: from.toFormat("d. M."), weekdayLabel: from.toFormat("ccc") };
		}

		const weekdayLabel = `${from.toFormat("ccc")} – ${till.toFormat("ccc")}`;

		if (from.hasSame(till, "month")) return { dateLabel: `${from.day}.–${till.toFormat("d. M.")}`, weekdayLabel };
		if (from.hasSame(till, "year"))
			return { dateLabel: `${from.toFormat("d. M.")} – ${till.toFormat("d. M.")}`, weekdayLabel };
		return { dateLabel: `${from.toFormat("d. M. yyyy")} – ${till.toFormat("d. M. yyyy")}`, weekdayLabel };
	}

	private describeFilter(filter: ProgramExportFilter): string {
		const parts: string[] = [];

		const years = [...(filter.year ?? [])].sort((a, b) => a - b);
		if (years.length) parts.push(years.join(", "));
		if (filter.dateFrom && filter.dateTill) {
			parts.push(
				`${this.date(filter.dateFrom).toFormat("d. M. yyyy")} – ${this.date(filter.dateTill).toFormat("d. M. yyyy")}`,
			);
		} else if (filter.dateFrom) {
			parts.push(`Budoucí akce od ${this.date(filter.dateFrom).toFormat("d. M. yyyy")}`);
		} else if (filter.dateTill) {
			parts.push(`do ${this.date(filter.dateTill).toFormat("d. M. yyyy")}`);
		}
		if (!years.length && !filter.dateFrom && !filter.dateTill) parts.push("Všechny akce");

		if (filter.status?.length)
			parts.push(filter.status.map((status) => PROGRAM_STATUS_LABELS[status] ?? status).join(", "));
		if (filter.my) parts.push("Moje akce");
		if (filter.noleader) parts.push("Bez vedoucího");
		if (filter.search?.trim()) parts.push(`„${filter.search.trim()}“`);

		return parts.join(" · ");
	}

	private date(value: string) {
		return DateTime.fromISO(value, { zone: ZONE }).setLocale("cs");
	}

	private capitalize(value: string) {
		return value.charAt(0).toLocaleUpperCase("cs") + value.slice(1);
	}

	private pluralEvents(count: number) {
		return count >= 1 && count <= 4 ? "akce" : "akcí";
	}
}
