import { BadRequestException, Injectable } from "@nestjs/common";
import * as Handlebars from "handlebars";
import { marked } from "marked";
import { existsSync, readFileSync } from "fs";
import { readdir, readFile, unlink, writeFile } from "fs/promises";
import * as path from "path";
import * as puppeteer from "puppeteer";
import { pathToFileURL } from "url";
import { string2Date } from "src/helpers/string2date";
import { Event } from "src/models/events/entities/event.entity";
import { Member } from "src/models/members/entities/member.entity";

const TEMPLATES_DIR = path.resolve("assets/registration-templates");
const TEMPLATE_FILE = "template.html";
const META_FILE = "meta.json";

const IMG_DIR = path.resolve("assets/img");

/** Fixed accent palette offered when generating a registration. */
const PALETTES: Record<string, string> = {
	black: "#1a1a1a",
	blue: "#2a3478",
	green: "#799f3d",
	red: "#d2232a",
	orange: "#e28f26",
};

export interface RegistrationTemplate {
	id: string;
	name: string;
}

@Injectable()
export class EventRegistrationService {
	/** Lists the available templates by scanning the templates directory (drop a folder, it appears). */
	async listTemplates(): Promise<RegistrationTemplate[]> {
		let entries: string[] = [];
		try {
			entries = await readdir(TEMPLATES_DIR);
		} catch {
			return [];
		}

		const templates: RegistrationTemplate[] = [];
		for (const id of entries) {
			if (!/^[a-z0-9_-]+$/i.test(id)) continue;
			const dir = path.join(TEMPLATES_DIR, id);
			if (!existsSync(path.join(dir, TEMPLATE_FILE))) continue;

			let name = id;
			try {
				const meta = JSON.parse(await readFile(path.join(dir, META_FILE), "utf-8"));
				if (typeof meta?.name === "string" && meta.name.trim()) name = meta.name.trim();
			} catch {
				// no/invalid meta.json — fall back to the folder name
			}
			templates.push({ id, name });
		}

		return templates.sort((a, b) => a.name.localeCompare(b.name, "cs"));
	}

	async generateRegistration(event: Event, templateId: string, color: string, note?: string): Promise<Buffer> {
		this.assertGeneratable(event);
		const accent = PALETTES[color];
		if (!accent) throw new BadRequestException("Neplatná barva.");

		const templateDir = await this.resolveTemplateDir(templateId);

		const source = await readFile(path.join(templateDir, TEMPLATE_FILE), "utf-8");
		const rendered = Handlebars.compile(source)(this.buildContext(event, accent, note));
		const html = this.inlineIcons(this.injectAccent(rendered, accent), accent);

		return this.htmlToPdf(html, templateDir);
	}

	/** Forces the chosen accent onto the template's `--accent` variable, overriding the template's own default. */
	private injectAccent(html: string, accent: string): string {
		const override = `<style>:root{--accent:${accent} !important;}</style>`;
		if (html.includes("</head>")) return html.replace("</head>", `${override}</head>`);
		if (html.includes("<body")) return html.replace("<body", `${override}<body`);
		return html + override;
	}

	/**
	 * Swaps each decorative `<img class="icon" src="…svg">` for the inline SVG recolored to the accent.
	 * The SVG paths carry no fill, so a `fill` on the root `<svg>` tints the whole icon. Other images
	 * (e.g. the brand logo) keep their own colors. Templates keep the `<img>` so they still preview in a browser.
	 */
	private inlineIcons(html: string, accent: string): string {
		return html.replace(/<img\b[^>]*\bclass="[^"]*\bicon\b[^"]*"[^>]*>/g, (tag) => {
			const src = tag.match(/\bsrc="([^"]+)"/)?.[1];
			const cls = tag.match(/\bclass="([^"]+)"/)?.[1] ?? "icon";
			if (!src || !/\.svg$/i.test(src)) return tag;

			const file = path.join(IMG_DIR, path.basename(src));
			let svg: string;
			try {
				svg = readFileSync(file, "utf-8");
			} catch {
				return tag;
			}

			const start = svg.indexOf("<svg");
			if (start < 0) return tag;
			svg = svg.slice(start).replace("<svg ", `<svg fill="${accent}" `);
			return `<span class="${cls}">${svg}</span>`;
		});
	}

	/** Refuses generation when the data the form relies on is missing, listing exactly what. */
	private assertGeneratable(event: Event): void {
		const missing: string[] = [];
		if (!event.name?.trim()) missing.push("název akce");
		if (!event.leaders?.[0]?.mobile?.trim()) missing.push("mobil na vedoucího");
		if (!event.leaders?.[0]?.email?.trim()) missing.push("email na vedoucího");

		if (missing.length) {
			throw new BadRequestException(`Nelze vygenerovat přihlášku, chybí: ${missing.join(", ")}.`);
		}
	}

	/** Validates the requested template id and returns its directory (guards against path traversal). */
	private async resolveTemplateDir(templateId: string): Promise<string> {
		if (!templateId || !/^[a-z0-9_-]+$/i.test(templateId)) {
			throw new BadRequestException("Neplatná šablona.");
		}
		const dir = path.join(TEMPLATES_DIR, templateId);
		if (!existsSync(path.join(dir, TEMPLATE_FILE))) {
			throw new BadRequestException(`Šablona "${templateId}" neexistuje.`);
		}
		return dir;
	}

	/** Renders HTML to a PDF buffer with headless Chromium. Writes a temp file in the template dir so relative images/fonts/CSS resolve. */
	private async htmlToPdf(html: string, templateDir: string): Promise<Buffer> {
		const tempFile = path.join(templateDir, `.render-${Date.now()}-${Math.random().toString(36).slice(2)}.html`);
		let browser: puppeteer.Browser | undefined;

		try {
			await writeFile(tempFile, html, "utf-8");

			browser = await puppeteer.launch({
				executablePath: this.resolveChromiumPath(),
				args: ["--no-sandbox", "--disable-setuid-sandbox"],
			});

			const page = await browser.newPage();
			await page.goto(pathToFileURL(tempFile).href, { waitUntil: "networkidle0" });
			const pdf = await page.pdf({
				format: "A4",
				landscape: true,
				printBackground: true,
				preferCSSPageSize: true,
			});
			return Buffer.from(pdf);
		} finally {
			await browser?.close().catch(() => undefined);
			await unlink(tempFile).catch(() => undefined);
		}
	}

	/** Picks the Chromium binary: explicit env (prod), then a system install, then Puppeteer's bundled download. */
	private resolveChromiumPath(): string | undefined {
		const fromEnv = process.env["PUPPETEER_EXECUTABLE_PATH"];
		if (fromEnv) return fromEnv;

		const candidates = ["/usr/bin/chromium", "/usr/bin/chromium-browser", "/usr/bin/google-chrome"];
		const systemChromium = candidates.find((candidate) => existsSync(candidate));
		if (systemChromium) return systemChromium;

		return undefined; // fall back to Puppeteer's bundled Chromium
	}

	private buildContext(event: Event, accent: string, note?: string) {
		const contactsLine = (event.leaders || []).map((member) => {
			const fullName = [member.firstName, member.lastName].filter(Boolean).join(" ");
			const name = member.nickname
				? `${member.firstName} "${member.nickname}" ${member.lastName}`
				: fullName;

			const phone = member.mobile ? `(${member.mobile})` : "";
			const email = member.email || "";

			return [name, phone, email].filter(Boolean).join(" ");
		});

		return {
			accent,
			name: event.name || "",
			place: event.place || "",
			dateFrom: this.formatDate(event.dateFrom),
			dateTill: this.formatDate(event.dateTill),
			departure: this.formatDeparture(event.dateFrom, event.timeFrom, event.meetingPlaceStart),
			arrival: this.formatDeparture(event.dateTill, event.timeTill, event.meetingPlaceEnd),
			descriptionHtml: this.renderMarkdown(event.description),
			price: event.price != null ? `${event.price} Kč` : "",
			itemListHtml: this.renderMarkdown(event.itemList),
			noteHtml: this.renderMarkdown(note),
			contactsLine: contactsLine.filter(Boolean).join(", "),
		};
	}

	/** Renders a markdown field the same way the web does (`MarkdownPipe`), so the PDF matches the site. */
	private renderMarkdown(markdown: string | null | undefined): string {
		if (!markdown?.trim()) return "";
		return marked.parse(markdown, { async: false, breaks: true });
	}

	private formatDate(date: string | null | undefined): string {
		const d = string2Date(date);
		return d ? `${d.getDate()}. ${d.getMonth() + 1}. ${d.getFullYear()}` : "";
	}

	private formatDeparture(date: string | null, time: string | null, place: string | null): string {
		return [this.formatDate(date), time, place].filter(Boolean).join(" ");
	}
}
