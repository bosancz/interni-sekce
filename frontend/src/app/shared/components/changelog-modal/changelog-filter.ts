export interface ChangelogType {
	type: string;
	emoji: string;
	label: string;
	count: number;
}

const TYPES: Omit<ChangelogType, "count">[] = [
	{ type: "feat", emoji: "✨", label: "Novinky" },
	{ type: "patch", emoji: "🚸", label: "Vylepšení" },
	{ type: "fix", emoji: "🐛", label: "Opravy" },
	{ type: "style", emoji: "🎨", label: "Vzhled" },
	{ type: "perf", emoji: "⚡️", label: "Výkon" },
	{ type: "refactor", emoji: "♻️", label: "Refaktoring" },
	{ type: "docs", emoji: "📝", label: "Dokumentace" },
	{ type: "test", emoji: "✅", label: "Testy" },
	{ type: "build", emoji: "📦️", label: "Build" },
	{ type: "ci", emoji: "👷", label: "CI" },
	{ type: "revert", emoji: "⏪️", label: "Revert" },
	{ type: "chore", emoji: "🔧", label: "Údržba" },
	{ type: "non-conventional", emoji: "❓", label: "Ostatní" },
];

const ENTRY_TYPE = /^- <span class="changelog-type" title="([^"]+)">/;

export function getChangelogTypes(markdown: string): ChangelogType[] {
	const counts = new Map<string, number>();
	for (const line of markdown.split("\n")) {
		const type = line.match(ENTRY_TYPE)?.[1];
		if (type) counts.set(type, (counts.get(type) ?? 0) + 1);
	}
	return TYPES.filter((t) => counts.has(t.type)).map((t) => ({ ...t, count: counts.get(t.type)! }));
}

export function filterChangelog(markdown: string, selectedTypes: ReadonlySet<string>): string {
	if (!selectedTypes.size) return markdown;

	const blocks: { lines: string[]; entries: number; separator: boolean }[] = [];
	let block = { lines: [] as string[], entries: 0, separator: false };
	blocks.push(block);

	for (const line of markdown.split("\n")) {
		if (line.startsWith("## ") || line.trim() === "---") {
			block = { lines: [], entries: 0, separator: line.trim() === "---" };
			blocks.push(block);
		}
		const type = line.match(ENTRY_TYPE)?.[1];
		if (type && !selectedTypes.has(type)) continue;
		if (line.startsWith("- ")) block.entries++;
		block.lines.push(line);
	}

	const kept = blocks.filter((b, i) => i === 0 || b.separator || b.entries > 0);
	const result = kept.filter(
		(b, i) => !b.separator || (kept.slice(0, i).some((p) => p.entries) && kept.slice(i + 1).some((n) => n.entries)),
	);
	return result.some((b) => b.entries) ? result.flatMap((b) => b.lines).join("\n") : "";
}
