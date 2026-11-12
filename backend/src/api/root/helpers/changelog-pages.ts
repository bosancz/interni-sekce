const ENTRY_TYPE = /^- <span class="changelog-type" title="([^"]+)">/;

export interface ChangelogLine {
	text: string;
	type: string | null;
}

export interface ChangelogSection {
	lines: ChangelogLine[];
	separatorBefore: boolean;
}

export interface ChangelogTypeCount {
	type: string;
	count: number;
}

export interface ChangelogPage {
	content: string;
	nextOffset: number | null;
}

export function parseChangelog(markdown: string): ChangelogSection[] {
	const sections: ChangelogSection[] = [];
	let separator = false;
	let section: ChangelogSection | null = null;

	for (const text of markdown.split("\n")) {
		if (text.trim() === "---") {
			separator = true;
			section = null;
			continue;
		}
		if (text.startsWith("## ") || !section) {
			if (!text.startsWith("## ") && !text.trim()) continue;
			section = { lines: [], separatorBefore: separator };
			sections.push(section);
			separator = false;
		}
		section.lines.push({ text, type: text.match(ENTRY_TYPE)?.[1] ?? null });
	}

	return sections;
}

export function countChangelogTypes(sections: ChangelogSection[]): ChangelogTypeCount[] {
	const counts = new Map<string, number>();
	for (const section of sections) {
		for (const line of section.lines) {
			if (line.type) counts.set(line.type, (counts.get(line.type) ?? 0) + 1);
		}
	}
	return [...counts].map(([type, count]) => ({ type, count }));
}

export function filterChangelog(sections: ChangelogSection[], types: ReadonlySet<string>): ChangelogSection[] {
	if (!types.size) return sections;

	const result: ChangelogSection[] = [];
	let separator = false;

	for (const section of sections) {
		separator ||= section.separatorBefore;
		const lines = section.lines.filter((line) => !line.type || types.has(line.type));
		if (!lines.some(isEntry)) continue;
		result.push({ lines, separatorBefore: separator && result.length > 0 });
		separator = false;
	}

	return result;
}

export function getChangelogPage(sections: ChangelogSection[], offset: number, pageEntries: number): ChangelogPage {
	const parts: string[] = [];
	let entries = 0;
	let index = offset;

	while (index < sections.length && (index === offset || entries < pageEntries)) {
		const section = sections[index];
		if (section.separatorBefore && index > 0) parts.push("---");
		parts.push(
			section.lines
				.map((line) => line.text)
				.join("\n")
				.trimEnd(),
		);
		entries += section.lines.filter(isEntry).length;
		index++;
	}

	return {
		content: parts.join("\n\n"),
		nextOffset: index < sections.length ? index : null,
	};
}

function isEntry(line: ChangelogLine): boolean {
	return line.text.startsWith("- ");
}
