import { Injectable } from "@nestjs/common";
import * as Handlebars from "handlebars";
import { readFile, unlink, writeFile } from "fs/promises";
import { DateTime } from "luxon";
import { tmpdir } from "os";
import * as path from "path";
import * as puppeteer from "puppeteer";
import { pathToFileURL } from "url";
import { resolveChromiumPath } from "src/helpers/chromium";
import { Event, EventStates } from "src/models/events/entities/event.entity";

const TEMPLATE_FILE = path.resolve("assets/program-template/template.html");
const FONTS_DIR = path.resolve("assets/fonts");
const LOGO_FILE = path.resolve("assets/img/sanlogo-07.svg");

const ZONE = "Europe/Prague";

const STATUS_LABELS: Record<string, string> = {
	[EventStates.draft]: "Připravovaná",
	[EventStates.pending]: "Čeká na schválení",
	[EventStates.rejected]: "Vrácená k úpravám",
	[EventStates.public]: "V programu",
	[EventStates.cancelled]: "Zrušená",
};

export interface ProgramPdfFilter {
	year?: number[];
	dateFrom?: string;
	dateTill?: string;
	status?: string[];
	search?: string;
	my?: boolean;
	noleader?: boolean;
}

@Injectable()
export class EventsProgramPdfService {
	private template?: HandlebarsTemplateDelegate;

	async renderProgram(events: Event[], filter: ProgramPdfFilter): Promise<Buffer> {
		const template = await this.getTemplate();
		const html = template(this.buildContext(events, filter));

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

	private async getTemplate() {
		if (!this.template) this.template = Handlebars.compile(await readFile(TEMPLATE_FILE, "utf-8"));
		return this.template;
	}

	private footerTemplate() {
		const style =
			"font-family: 'Helvetica Neue', Arial, sans-serif; font-size: 8px; color: #8a8fa3; width: 100%; padding: 0 14mm; display: flex; justify-content: space-between;";
		return `<div style="${style}"><span>Interní sekce ŠÁN · Program akcí</span><span><span class="pageNumber"></span> / <span class="totalPages"></span></span></div>`;
	}

	private buildContext(events: Event[], filter: ProgramPdfFilter) {
		const sorted = [...events].sort(
			(a, b) => a.dateFrom.localeCompare(b.dateFrom) || a.dateTill.localeCompare(b.dateTill) || a.id - b.id,
		);

		const months: { label: string; events: ReturnType<EventsProgramPdfService["eventContext"]>[] }[] = [];
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
			fontsUrl: pathToFileURL(FONTS_DIR).href,
			logoUrl: pathToFileURL(LOGO_FILE).href,
			subtitle: this.describeFilter(filter),
			generatedAt: DateTime.now().setZone(ZONE).toFormat("d. M. yyyy"),
			countLabel: `${events.length} ${this.pluralEvents(events.length)}`,
			months,
		};
	}

	private eventContext(event: Event) {
		const status = event.status !== EventStates.public ? (STATUS_LABELS[event.status] ?? event.status) : null;

		return {
			name: event.name,
			...this.dateLabels(event.dateFrom, event.dateTill),
			place: event.place,
			leaders: (event.leaders ?? []).map((leader) => leader.nickname || leader.firstName).filter(Boolean),
			groups: (event.groups ?? [])
				.map((group) => ({ shortName: group.shortName, color: group.color || "#6b7185" }))
				.sort((a, b) => a.shortName.localeCompare(b.shortName, "cs")),
			status,
			statusClass: event.status,
			cancelled: event.status === EventStates.cancelled,
		};
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

	private describeFilter(filter: ProgramPdfFilter): string {
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
			parts.push(filter.status.map((status) => STATUS_LABELS[status] ?? status).join(", "));
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
