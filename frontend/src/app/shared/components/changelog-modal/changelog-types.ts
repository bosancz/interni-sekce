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

export function getChangelogTypes(counts: { type: string; count: number }[]): ChangelogType[] {
	const byType = new Map(counts.map((c) => [c.type, c.count]));
	return TYPES.filter((t) => byType.has(t.type)).map((t) => ({ ...t, count: byType.get(t.type)! }));
}
