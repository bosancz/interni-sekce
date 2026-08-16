import { Injectable, Logger } from "@nestjs/common";
import { CPVEventResponse } from "../dto/cpv-event.dto";

const CALENDAR_URL = "https://www.raft.cz/kalendar.aspx";

// Appended to every event name so its provenance is visible in the calendar without pushing the
// name itself out of the truncated calendar bar. There is only one source for now; when more are
// added this should become a per-event value.
const SOURCE_LABEL = "Raft.cz";

// The event listing is rendered by an ASP.NET WebForms page that only shows a single day by
// default. To get the full list we replay the "Výpis všech akcí" (list all events) postback,
// which is triggered by this control.
const LIST_ALL_EVENT_TARGET = "ctl00$ContentPlaceHolder1$Vse";

/**
 * Scrapes the vodácký (paddling) events calendar from raft.cz.
 *
 * raft.cz/kalendar.aspx is a classic ASP.NET WebForms page: the initial GET only lists events
 * for the current day, and "show all" is a `__doPostBack`. So we GET the page to harvest the
 * hidden form fields (`__VIEWSTATE` & co.), then POST them back together with the list-all
 * event target to receive the full listing, and parse the resulting event cards.
 */
@Injectable()
export class CPVEventsService {
	private readonly logger = new Logger(CPVEventsService.name);

	async getEvents(): Promise<CPVEventResponse[]> {
		const initialHtml = await this.fetchText(CALENDAR_URL);
		const form = this.extractFormFields(initialHtml);

		const body = new URLSearchParams({
			...form,
			__EVENTTARGET: LIST_ALL_EVENT_TARGET,
			__EVENTARGUMENT: "",
		});

		const listHtml = await this.fetchText(CALENDAR_URL, {
			method: "POST",
			headers: { "Content-Type": "application/x-www-form-urlencoded" },
			body: body.toString(),
		});

		return this.parseEvents(listHtml);
	}

	private async fetchText(url: string, init?: RequestInit): Promise<string> {
		const res = await fetch(url, init);
		if (!res.ok) {
			const detail = await res.text().catch(() => "");
			this.logger.warn(`raft.cz responded with HTTP ${res.status} for ${url}: ${detail.slice(0, 200)}`);
			throw new Error(`Failed to load raft.cz calendar (HTTP ${res.status})`);
		}
		return res.text();
	}

	/** Pulls the ASP.NET hidden state fields required to replay a postback. */
	private extractFormFields(html: string): Record<string, string> {
		const fields: Record<string, string> = {};
		for (const name of ["__VIEWSTATE", "__VIEWSTATEGENERATOR", "__EVENTVALIDATION"]) {
			const value = this.matchHiddenField(html, name);
			if (value !== null) fields[name] = value;
		}
		return fields;
	}

	private matchHiddenField(html: string, name: string): string | null {
		const regex = new RegExp(`id="${name}"[^>]*\\bvalue="([^"]*)"`);
		const match = html.match(regex);
		return match ? this.decodeHtml(match[1]) : null;
	}

	/**
	 * Parses the event cards out of the list-all listing. Each event is a card whose title link
	 * carries the name and detail URL, followed by a date block that is either a single day
	 * (`den:`) or a range (`Začátek:` … `Konec:`).
	 */
	private parseEvents(html: string): CPVEventResponse[] {
		const events: CPVEventResponse[] = [];

		// Each event card container id looks like ctl00_ContentPlaceHolder1_dg_ctlNN_Nazev.
		const cardRegex = /id="ctl00_ContentPlaceHolder1_dg_ctl\d+_Nazev"([\s\S]*?)(?=id="ctl00_ContentPlaceHolder1_dg_ctl\d+_Nazev"|id="ctl00_ContentPlaceHolder1_zmena")/g;

		for (const cardMatch of html.matchAll(cardRegex)) {
			const card = cardMatch[1];

			const linkMatch = card.match(/<a[^>]*href="(kalendar\.aspx\?ID=\d+)"[^>]*>([\s\S]*?)<\/a>/);
			if (!linkMatch) continue;

			const link = new URL(this.decodeHtml(linkMatch[1]), CALENDAR_URL).toString();
			const name = this.stripTags(linkMatch[2]);
			if (!name) continue;

			const dates = this.extractDates(card);
			if (!dates) continue;

			const river = this.extractRiver(card);

			events.push({
				name: `${name} — ${SOURCE_LABEL}`,
				dateFrom: dates.dateFrom,
				dateTill: dates.dateTill,
				...(river ? { description: river } : {}),
				link,
			});
		}

		if (events.length === 0) {
			this.logger.warn("Parsed 0 events from raft.cz calendar — the page layout may have changed.");
		}

		return events;
	}

	private extractDates(card: string): { dateFrom: string; dateTill: string } | null {
		// Multi-day event: explicit start and end.
		const start = this.matchLabelledDate(card, "Začátek");
		const end = this.matchLabelledDate(card, "Konec");
		if (start && end) return { dateFrom: start, dateTill: end };

		// Single-day event.
		const day = this.matchLabelledDate(card, "den");
		if (day) return { dateFrom: day, dateTill: day };

		return null;
	}

	private matchLabelledDate(card: string, label: string): string | null {
		const regex = new RegExp(`<strong>${label}:</strong>\\s*<span[^>]*>\\s*(\\d{2})\\.(\\d{2})\\.(\\d{4})\\s*</span>`);
		const match = card.match(regex);
		if (!match) return null;
		const [, day, month, year] = match;
		return `${year}-${month}-${day}`;
	}

	private extractRiver(card: string): string | undefined {
		const match = card.match(/<strong>řeka:<\/strong>\s*<a[^>]*>([\s\S]*?)<\/a>/);
		if (!match) return undefined;
		const river = this.stripTags(match[1]);
		return river || undefined;
	}

	private stripTags(html: string): string {
		return this.decodeHtml(html.replace(/<[^>]*>/g, "")).replace(/\s+/g, " ").trim();
	}

	private decodeHtml(text: string): string {
		return text
			.replace(/&amp;/g, "&")
			.replace(/&lt;/g, "<")
			.replace(/&gt;/g, ">")
			.replace(/&quot;/g, '"')
			.replace(/&#39;/g, "'")
			.replace(/&nbsp;/g, " ")
			.replace(/&#(\d+);/g, (_, code: string) => String.fromCodePoint(Number(code)))
			.replace(/&#x([0-9a-fA-F]+);/g, (_, code: string) => String.fromCodePoint(parseInt(code, 16)));
	}
}
