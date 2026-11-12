import { countChangelogTypes, filterChangelog, getChangelogPage, parseChangelog } from "./changelog-pages";

const entry = (type: string, text: string) => `- <span class="changelog-type" title="${type}">x</span> ${text}`;

const MARKDOWN = [
	"## v2",
	"",
	entry("feat", "a"),
	entry("fix", "b"),
	"",
	"## v1",
	"",
	entry("fix", "c"),
	"",
	"---",
	"",
	"## v0",
	"",
	entry("feat", "d"),
	entry("feat", "e"),
	"",
].join("\n");

describe("changelog pages", () => {
	const sections = parseChangelog(MARKDOWN);

	it("splits the file into sections and marks the separator", () => {
		expect(sections.map((s) => s.lines[0].text)).toEqual(["## v2", "## v1", "## v0"]);
		expect(sections.map((s) => s.separatorBefore)).toEqual([false, false, true]);
	});

	it("counts types over the whole file", () => {
		expect(countChangelogTypes(sections)).toEqual([
			{ type: "feat", count: 3 },
			{ type: "fix", count: 2 },
		]);
	});

	it("fills a page with whole sections until it has enough entries", () => {
		const first = getChangelogPage(sections, 0, 2);
		expect(first.nextOffset).toBe(1);
		expect(first.content).toContain(" a");
		expect(first.content).not.toContain("## v1");

		const second = getChangelogPage(sections, 1, 2);
		expect(second.nextOffset).toBeNull();
		expect(second.content).toContain("## v1");
		expect(second.content).toMatch(/c\n\n---\n\n## v0/);
	});

	it("always returns at least one section", () => {
		expect(getChangelogPage(sections, 0, 0).nextOffset).toBe(1);
	});

	it("drops other types and empty sections, keeping a separator between kept sections", () => {
		const fix = filterChangelog(sections, new Set(["fix"]));
		expect(fix.map((s) => s.lines[0].text)).toEqual(["## v2", "## v1"]);
		expect(getChangelogPage(fix, 0, 10).content).not.toContain(" a");
		expect(getChangelogPage(fix, 0, 10).content).not.toContain("---");

		const feat = filterChangelog(sections, new Set(["feat"]));
		expect(feat.map((s) => s.lines[0].text)).toEqual(["## v2", "## v0"]);
		expect(feat[1].separatorBefore).toBe(true);
	});

	it("returns an empty page past the end", () => {
		expect(getChangelogPage([], 0, 10)).toEqual({ content: "", nextOffset: null });
	});
});
