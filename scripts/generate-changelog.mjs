#!/usr/bin/env node
// Generate a CHANGELOG.md section from conventional commits.
//
// Reads the commits in a range (previous tag .. target ref), keeps the
// user-facing conventional types (feat, fix) and prepends a
// "## <version> — <date>" section to CHANGELOG.md. Every version is a single
// flat list — the type is carried by a gitmoji at the start of each entry
// instead of a heading — with features first, fixes second and the technical
// types after them. Existing content (including manual edits to older
// versions) is preserved.
//
// Usage:
//   node scripts/generate-changelog.mjs --new-tag v4.4.0 [--date 2026-07-28]
//                                       [--from v4.3.0] [--to HEAD]
//                                       [--file CHANGELOG.md] [--stdout]
//                                       [--repo-url https://github.com/o/r]
//                                       [--list-other]
//
// Defaults: --to HEAD; --from = the latest v* tag reachable from --to (--to itself
// included, so re-running on an already tagged commit yields an empty section rather
// than repeating the previous version);
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

// Every Conventional Commits type, in display order — the types visitors notice first
// (features, fixes, then visual changes), the technical ones after them — each with the
// gitmoji that labels its entries; the type is carried by the emoji, not by a heading.
// Subjects that are not conventional commits (and merge commits, which `git log --no-merges`
// drops) are the only thing left out.
const SECTIONS = [
	{ type: "feat", emoji: "✨" },
	{ type: "fix", emoji: "🐛" },
	{ type: "style", emoji: "🎨" },
	{ type: "perf", emoji: "⚡️" },
	{ type: "refactor", emoji: "♻️" },
	{ type: "docs", emoji: "📝" },
	{ type: "test", emoji: "✅" },
	{ type: "build", emoji: "📦️" },
	{ type: "ci", emoji: "👷" },
	{ type: "revert", emoji: "⏪️" },
	{ type: "chore", emoji: "🔧" },
];

const CONVENTIONAL = /^(\w+)(?:\(([^)]*)\))?(!)?:\s*(.+)$/;

// Issue references, collected from the whole commit message and appended to the entry as
// "(#123)" — the frontend turns those into links to the GitHub issue. Two accepted spellings:
// a GitHub closing keyword anywhere in the body ("Closes #123", the trailer Claude Code and
// GitHub both use), or a bare "(#123)" in the subject.
const ISSUE_KEYWORD_REF = /(?:close[sd]?|fix(?:e[sd])?|resolve[sd]?|refs?)\s+#(\d+)/gi;
const ISSUE_SUBJECT_REF = /\(#(\d+)\)/g;

// The references are re-rendered at the end of the entry, so whatever form they took in the
// subject is stripped from the description — together with the separator they hang off, so
// "…tlačítko, closes #38" does not leave a dangling comma.
const ISSUE_IN_SUBJECT = /\s*[,;–-]?\s*(?:\(#\d+\)|(?:close[sd]?|fix(?:e[sd])?|resolve[sd]?|refs?)\s+#\d+)/gi;

function collectIssues(text, pattern) {
	pattern.lastIndex = 0;
	const issues = [];
	for (let m = pattern.exec(text); m; m = pattern.exec(text)) issues.push(Number(m[1]));
	return issues;
}

function categorize(commits) {
	const buckets = new Map(SECTIONS.map((s) => [s.type, new Map()]));
	const other = [];

	for (const { hash, subject, body } of commits) {
		const match = CONVENTIONAL.exec(subject);
		if (!match) {
			other.push(subject);
			continue;
		}
		const type = match[1].toLowerCase();
		if (!buckets.has(type)) {
			other.push(subject);
			continue;
		}

		const issues = [
			...collectIssues(subject, ISSUE_SUBJECT_REF),
			...collectIssues(`${subject}\n${body}`, ISSUE_KEYWORD_REF),
		];
		const description = match[4].replace(ISSUE_IN_SUBJECT, "").trim();
		const text = description.charAt(0).toUpperCase() + description.slice(1);

		// same description twice (e.g. a fix reapplied on another branch) collapses into one
		// entry carrying the issues of both
		const entries = buckets.get(type);
		const entry = entries.get(text) ?? { text, hash, issues: new Set() };
		for (const issue of issues) entry.issues.add(issue);
		entries.set(text, entry);
	}

	return { buckets, other };
}

// Each entry opens with the gitmoji of its type and links to the commit it came from; a "#123"
// reference is rendered after it and linked to the issue by the frontend. Markdown special
// characters in the description would break the link syntax, so they are escaped.
function renderEntry({ text, hash, issues }, emoji, repoUrl) {
	const label = text.replace(/([\\`*_[\]()])/g, "\\$1");
	const line = `- ${emoji} [${label}](${repoUrl}/commit/${hash})`;
	if (!issues.size) return line;
	const refs = [...issues].sort((a, b) => a - b).map((issue) => `#${issue}`);
	return `${line} (${refs.join(", ")})`;
}

// Base for the commit links, taken from the origin remote so a fork/rename needs no edit here.
const FALLBACK_REPO_URL = "https://github.com/bosancz/interni-sekce";

function repoUrlFromGit() {
	try {
		const url = git(["remote", "get-url", "origin"]);
		const normalized = url
			.replace(/^git@github\.com:/, "https://github.com/")
			.replace(/\.git$/, "")
			.replace(/\/+$/, "");
		return normalized.startsWith("http") ? normalized : FALLBACK_REPO_URL;
	} catch {
		return FALLBACK_REPO_URL;
	}
}

// One flat list per version — the types follow the SECTIONS order, so features and fixes open
// the list, and each entry is labelled by its own gitmoji rather than by a heading.
function renderSection(version, date, buckets, repoUrl) {
	const lines = [`## ${version} — ${date}`, ""];
	const entries = SECTIONS.flatMap(({ type, emoji }) =>
		[...buckets.get(type).values()].map((entry) => renderEntry(entry, emoji, repoUrl))
	);

	if (entries.length) lines.push(...entries, "");
	else lines.push("_Bez uživatelských změn._", "");

	return lines.join("\n");
}

// The changelog modal renders its own title and intro, so the file carries no header text at all —
// it starts straight with the newest "## <version>" section.
const DEFAULT_HEADER = "";

function prepend(file, section) {
	let content = existsSync(file) ? readFileSync(file, "utf8") : "";
	if (!content.trim()) content = DEFAULT_HEADER;

	// Split the file into any header text and the version sections, so the new section goes on top
	// of the list. The header may be empty — the file can start straight with "## <version>".
	const marker = content.startsWith("## ") ? 0 : content.indexOf("\n## ");
	if (marker === -1) {
		// No version sections yet — append after whatever header exists.
		const header = content.replace(/\s*$/, "");
		return header ? `${header}\n\n${section}\n` : `${section}\n`;
	}

	const splitAt = marker === 0 ? 0 : marker + 1; // keep the newline before "## " with the header
	const header = content.slice(0, splitAt).replace(/\s*$/, "");
	const rest = content.slice(splitAt);
	return header ? `${header}\n\n${section}\n${rest}` : `${section}\n${rest}`;
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
			from = git(["describe", "--tags", "--abbrev=0", "--match", "v*", to]);
		} catch {
			from = null; // no earlier tag — take the whole history
		}
	}

	const date = typeof args.date === "string" ? args.date : git(["log", "-1", "--format=%cs", to]);
	const range = from ? `${from}..${to}` : to;

	// hash + subject + body per commit, delimited by the ASCII record/unit separators so
	// multi-line bodies (which is where "Closes #123" lives) survive the split
	const commits = git(["log", range, "--no-merges", "--format=\x1e%H\x1f%s\x1f%b"])
		.split("\x1e")
		.filter((chunk) => chunk.trim())
		.map((chunk) => {
			const [hash = "", subject = "", body = ""] = chunk.split("\x1f");
			return { hash: hash.trim(), subject: subject.trim(), body: body.trim() };
		});

	const { buckets, other } = categorize(commits);

	if (args["list-other"]) {
		// Diagnostic: show the commits that would NOT appear in the changelog,
		// so they can be reviewed and folded in by hand when seeding.
		console.error(`# Uncategorized commits in ${range} (${other.length}):`);
		for (const s of other) console.error(`  - ${s}`);
	}

	const repoUrl = typeof args["repo-url"] === "string" ? args["repo-url"].replace(/\/+$/, "") : repoUrlFromGit();
	const section = renderSection(version, date, buckets, repoUrl);

	if (args.stdout) {
		process.stdout.write(section + "\n");
		return;
	}

	const file = typeof args.file === "string" ? args.file : "CHANGELOG.md";
	writeFileSync(file, prepend(file, section));
	console.error(`Prepended ${version} (${range}) to ${file}.`);
}

main();
