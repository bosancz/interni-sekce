#!/usr/bin/env node
// Generate a CHANGELOG.md section from conventional commits.
//
// Reads the commits in a range (previous tag .. target ref), keeps the
// user-facing conventional types (feat -> Novinky, fix -> Opravy), and
// prepends a "## <version> — <date>" section to CHANGELOG.md. Existing
// content (including manual edits to older versions) is preserved.
//
// Usage:
//   node scripts/generate-changelog.mjs --new-tag v4.4.0 [--date 2026-07-28]
//                                       [--from v4.3.0] [--to HEAD]
//                                       [--file CHANGELOG.md] [--stdout]
//                                       [--list-other]
//
// Defaults: --to HEAD; --from = the latest v* tag reachable before --to;
// --date = the committer date (YYYY-MM-DD) of --to. Nothing depends on the
// wall clock, so runs are reproducible.

import { execFileSync } from "node:child_process";
import { existsSync, readFileSync, writeFileSync } from "node:fs";

function parseArgs(argv) {
	const args = {};
	for (let i = 0; i < argv.length; i++) {
		const a = argv[i];
		if (a.startsWith("--")) {
			const key = a.slice(2);
			const next = argv[i + 1];
			if (next === undefined || next.startsWith("--")) {
				args[key] = true;
			} else {
				args[key] = next;
				i++;
			}
		}
	}
	return args;
}

function git(args) {
	return execFileSync("git", args, { encoding: "utf8" }).trim();
}

// Conventional types we surface, in display order. Everything else
// (chore/docs/style/refactor/test/ci/build/perf and non-conventional
// subjects) is intentionally dropped from the visitor-facing changelog.
const SECTIONS = [
	{ type: "feat", title: "Novinky" },
	{ type: "fix", title: "Opravy" },
];

const CONVENTIONAL = /^(\w+)(?:\(([^)]*)\))?(!)?:\s*(.+)$/;

function categorize(subjects) {
	const buckets = new Map(SECTIONS.map((s) => [s.type, []]));
	const other = [];

	for (const subject of subjects) {
		const match = CONVENTIONAL.exec(subject);
		if (!match) {
			other.push(subject);
			continue;
		}
		const type = match[1].toLowerCase();
		const description = match[4].trim();
		if (buckets.has(type)) {
			const text = description.charAt(0).toUpperCase() + description.slice(1);
			const list = buckets.get(type);
			if (!list.includes(text)) list.push(text);
		} else {
			other.push(subject);
		}
	}

	return { buckets, other };
}

function renderSection(version, date, buckets) {
	const lines = [`## ${version} — ${date}`, ""];
	let hasContent = false;

	for (const { type, title } of SECTIONS) {
		const items = buckets.get(type);
		if (!items.length) continue;
		hasContent = true;
		lines.push(`### ${title}`, "");
		for (const item of items) lines.push(`- ${item}`);
		lines.push("");
	}

	if (!hasContent) lines.push("_Bez uživatelských změn._", "");

	return lines.join("\n");
}

const DEFAULT_HEADER = ["# Seznam změn", "", "Přehled novinek a oprav v jednotlivých verzích aplikace.", ""].join("\n");

function prepend(file, section) {
	let content = existsSync(file) ? readFileSync(file, "utf8") : "";
	if (!content.trim()) content = DEFAULT_HEADER + "\n";

	const marker = content.indexOf("\n## ");
	if (marker === -1) {
		// No version sections yet — append after the header, keeping one blank line.
		const trimmed = content.replace(/\s*$/, "");
		return `${trimmed}\n\n${section}\n`;
	}

	const header = content.slice(0, marker + 1); // include the newline before "## "
	const rest = content.slice(marker + 1);
	return `${header.replace(/\s*$/, "")}\n\n${section}\n${rest}`;
}

function main() {
	const args = parseArgs(process.argv.slice(2));

	const to = typeof args.to === "string" ? args.to : "HEAD";
	const version = typeof args["new-tag"] === "string" ? args["new-tag"] : null;
	if (!version) {
		console.error("Error: --new-tag <version> is required.");
		process.exit(1);
	}

	let from = typeof args.from === "string" ? args.from : null;
	if (!from) {
		try {
			from = git(["describe", "--tags", "--abbrev=0", "--match", "v*", `${to}^`]);
		} catch {
			from = null; // no earlier tag — take the whole history
		}
	}

	const date = typeof args.date === "string" ? args.date : git(["log", "-1", "--format=%cs", to]);
	const range = from ? `${from}..${to}` : to;

	const subjects = git(["log", range, "--no-merges", "--format=%s"])
		.split("\n")
		.map((s) => s.trim())
		.filter(Boolean);

	const { buckets, other } = categorize(subjects);

	if (args["list-other"]) {
		// Diagnostic: show the commits that would NOT appear in the changelog,
		// so they can be reviewed and folded in by hand when seeding.
		console.error(`# Uncategorized commits in ${range} (${other.length}):`);
		for (const s of other) console.error(`  - ${s}`);
	}

	const section = renderSection(version, date, buckets);

	if (args.stdout) {
		process.stdout.write(section + "\n");
		return;
	}

	const file = typeof args.file === "string" ? args.file : "CHANGELOG.md";
	writeFileSync(file, prepend(file, section));
	console.error(`Prepended ${version} (${range}) to ${file}.`);
}

main();
