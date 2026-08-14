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
// Each entry ends with the avatars of its commit authors, linked to their GitHub
// profiles, and — when somebody else committed the work, which is what happens whenever
// Claude does — the committer's avatar tucked behind the author's; see resolveIdentities()
// for how a commit identity becomes a GitHub user.
//
// Usage:
//   node scripts/generate-changelog.mjs --new-tag v4.4.0 [--date 2026-07-28]
//                                       [--from v4.3.0] [--to HEAD]
//                                       [--file CHANGELOG.md] [--stdout]
//                                       [--repo-url https://github.com/o/r]
//                                       [--list-other] [--no-authors]
//   node scripts/generate-changelog.mjs --backfill [--file CHANGELOG.md]
//                                       [--repo-url https://github.com/o/r]
//
// --backfill adds the avatars to entries already written in the file, leaving everything
// else about them untouched. It is a maintenance mode for when the avatar markup changes:
// the sections of a released version are never regenerated (manual edits to them are meant
// to survive), so this is the only way to bring them up to the current format. Entries that
// already carry avatars are left alone, so it can be re-run safely.
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

function githubToken() {
	return process.env.GITHUB_TOKEN || process.env.GH_TOKEN || "";
}

// The identity fields every commit is read with, in one place so `git log` and the API agree on them.
const GIT_COMMIT_FORMAT = "%H\x1f%an\x1f%ae\x1f%cn\x1f%ce";

function commitFromFields(fields) {
	const [hash = "", authorName = "", authorEmail = "", committerName = "", committerEmail = ""] = fields;
	return {
		hash: hash.trim(),
		authorName: authorName.trim(),
		authorEmail: authorEmail.trim(),
		committerName: committerName.trim(),
		committerEmail: committerEmail.trim(),
	};
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

// Avatars are requested at twice their rendered size, so they stay sharp on retina screens.
const AVATAR_SIZE = 48;

// GitHub's private-email addresses carry the account they belong to — "1273865+SmallhillCZ@…" or
// the older "SmallhillCZ@…" — so those authors resolve to a profile without asking the API.
const GITHUB_NOREPLY = /^(?:(\d+)\+)?([A-Za-z\d](?:[A-Za-z\d]|-(?=[A-Za-z\d])){0,38})@users\.noreply\.github\.com$/i;

// GitHub signs every commit made through its web UI as its own account. That is not somebody to
// credit, and it would otherwise sit behind a good part of the entries, so such commits are shown
// with their author alone.
const BOT_COMMITTER_EMAILS = new Set(["noreply@github.com"]);

const GITHUB_API = "https://api.github.com";

function apiRepo(repoUrl) {
	const match = /^https:\/\/github\.com\/([^/]+)\/([^/]+)$/.exec(repoUrl);
	return match ? { owner: match[1], repo: match[2] } : null;
}

function avatarUrl(url) {
	const separator = url.includes("?") ? "&" : "?";
	return `${url}${separator}s=${AVATAR_SIZE}`;
}

/** Author of a commit GitHub knows nothing about — rendered as initials instead of an avatar. */
function anonymousAuthor(name) {
	return { name, login: null };
}

/**
 * Asks GitHub about a commit. It has to be pushed already, which it is whenever the changelog is
 * generated in CI; locally it may not be, and a 404 (like any other failure — no network, rate
 * limit, a repo the token cannot see) leaves the identity unresolved rather than failing the run.
 */
async function fetchCommit({ owner, repo }, hash, token) {
	const headers = { accept: "application/vnd.github+json", "user-agent": "generate-changelog" };
	if (token) headers.authorization = `Bearer ${token}`;

	const response = await fetch(`${GITHUB_API}/repos/${owner}/${repo}/commits/${hash}`, {
		headers,
		signal: AbortSignal.timeout(10000),
	});
	if (!response.ok) throw new Error(`GitHub API ${response.status} for commit ${hash}`);

	return response.json();
}

/**
 * The two identities of a commit as GitHub reports them: the address git recorded, paired with the
 * account GitHub matched it to (null when it matched none).
 */
function commitIdentities(data) {
	return ["author", "committer"].map((role) => ({
		name: data.commit?.[role]?.name ?? "",
		email: data.commit?.[role]?.email ?? "",
		login: data[role]?.login ?? null,
		avatar: data[role]?.avatar_url ?? null,
	}));
}

/**
 * Maps every distinct address in the range — authors and committers alike — to a GitHub account, so
 * entries can be rendered with their avatars. Resolution is per address, not per commit (a release
 * has a handful of people and hundreds of commits) and is attempted twice: from the address itself
 * when it is a GitHub no-reply one, otherwise by asking the API about one of that person's commits.
 * A lookup answers for both identities of the commit it names, so an address that shares a commit
 * with an already pending one — the usual author/committer pair — costs no request of its own.
 * Addresses that resolve to neither keep their name and are rendered as initials.
 */
async function resolveIdentities(commits, repoUrl, { useApi, token }) {
	const pending = new Map();
	for (const { hash, authorName, authorEmail, committerName, committerEmail } of commits) {
		if (authorEmail && !pending.has(authorEmail)) pending.set(authorEmail, { name: authorName, hash });
		if (committerEmail && !BOT_COMMITTER_EMAILS.has(committerEmail) && !pending.has(committerEmail)) {
			pending.set(committerEmail, { name: committerName, hash });
		}
	}

	const repo = apiRepo(repoUrl);
	const resolved = new Map();

	for (const [email, { name, hash }] of pending) {
		if (resolved.has(email)) continue;

		const noreply = GITHUB_NOREPLY.exec(email);
		if (noreply) {
			const [, id, login] = noreply;
			const avatar = id
				? avatarUrl(`https://avatars.githubusercontent.com/u/${id}`)
				: `https://github.com/${login}.png?size=${AVATAR_SIZE}`;
			resolved.set(email, { name, login, avatar });
			continue;
		}

		if (!useApi || !repo) {
			resolved.set(email, anonymousAuthor(name));
			continue;
		}

		try {
			for (const identity of commitIdentities(await fetchCommit(repo, hash, token))) {
				if (!identity.email || resolved.has(identity.email)) continue;
				resolved.set(
					identity.email,
					identity.login
						? { name: identity.name, login: identity.login, avatar: avatarUrl(identity.avatar) }
						: anonymousAuthor(identity.name),
				);
			}
			if (!resolved.has(email)) resolved.set(email, anonymousAuthor(name));
		} catch (err) {
			console.error(`Could not resolve the GitHub account of ${name} <${email}>: ${err.message}`);
			resolved.set(email, anonymousAuthor(name));
		}
	}

	return resolved;
}

/** Key under which an identity is deduplicated — the account when there is one, the name otherwise. */
function identityKey({ name, login }) {
	return login ? `login:${login.toLowerCase()}` : `name:${name}`;
}

/**
 * Who to credit for a commit: its author, plus the committer when that is somebody else — a commit
 * Claude wrote and a human authored, or the other way round. Commits where the two are the same
 * person carry a single avatar.
 */
function creditFor({ authorEmail, committerEmail }, identities) {
	const author = identities.get(authorEmail);
	if (!author) return null;

	// a bot address can still have been resolved — a lookup answers for both identities of the commit
	// it names, whether they were asked about or not — so it is filtered out here rather than there
	const committer = BOT_COMMITTER_EMAILS.has(committerEmail) ? null : identities.get(committerEmail);
	const distinct = committer && identityKey(committer) !== identityKey(author);
	return { author, committer: distinct ? committer : null };
}

function categorize(commits, identities) {
	const buckets = new Map(SECTIONS.map((s) => [s.type, new Map()]));
	const other = [];

	for (const commit of commits) {
		const { hash, subject, body } = commit;
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
		// entry carrying the issues — and the authors — of both
		const entries = buckets.get(type);
		const entry = entries.get(text) ?? { text, hash, issues: new Set(), credits: new Map() };
		for (const issue of issues) entry.issues.add(issue);

		// keyed by the author alone: the same person showing up with two different committers is
		// still one person to credit, and their avatar should not appear on the entry twice
		const credit = creditFor(commit, identities);
		if (credit && !entry.credits.has(identityKey(credit.author))) {
			entry.credits.set(identityKey(credit.author), credit);
		}

		entries.set(text, entry);
	}

	return { buckets, other };
}

function escapeMarkdown(text) {
	return text.replace(/([\\`*_[\]()])/g, "\\$1");
}

// Up to two letters taken from the author's name, for authors with no GitHub account to show.
function initials(name) {
	const letters = name
		.split(/[\s._-]+/)
		.filter(Boolean)
		.map((word) => [...word][0])
		.filter((letter) => /\p{L}/u.test(letter));
	return (letters.slice(0, 2).join("") || "?").toUpperCase();
}

function escapeHtml(text) {
	return text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

// A single avatar, carrying the person's name as its tooltip; somebody GitHub does not know gets a
// circle with their initials instead, which the frontend styles the same way.
function renderAvatar({ name, login, avatar }) {
	const title = escapeHtml(name);
	if (!login) return `<span class="changelog-avatar changelog-initials" title="${title}">${escapeHtml(initials(name))}</span>`;
	return `<img class="changelog-avatar" src="${escapeHtml(avatar)}" alt="${title}" title="${title}">`;
}

// The credit closing an entry: the author's avatar, linked to their GitHub profile, and behind it —
// nine tenths covered, the way GitHub stacks them — the committer's when that is somebody else. Only
// the author's is a link, and the stack does not open up on hover. The inline HTML is kept plain
// enough to survive Angular's sanitizer, and its whole layout hangs off these two class names.
function renderCredit({ author, committer }) {
	const authorAvatar = renderAvatar(author);
	const parts = [
		author.login
			? `<a class="changelog-author" href="https://github.com/${author.login}">${authorAvatar}</a>`
			: `<span class="changelog-author">${authorAvatar}</span>`,
	];
	if (committer) parts.push(`<span class="changelog-committer">${renderAvatar(committer)}</span>`);

	return `<span class="changelog-credit">${parts.join("")}</span>`;
}

// Each entry opens with the gitmoji of its type and links to the commit it came from; a "#123"
// reference is rendered after it and linked to the issue by the frontend, and the avatars of its
// authors close the line. Markdown special characters in the description would break the link
// syntax, so they are escaped.
function renderEntry({ text, hash, issues, credits }, emoji, repoUrl) {
	const parts = [`- ${emoji} [${escapeMarkdown(text)}](${repoUrl}/commit/${hash})`];

	if (issues.size) {
		const refs = [...issues].sort((a, b) => a - b).map((issue) => `#${issue}`);
		parts.push(`(${refs.join(", ")})`);
	}

	for (const credit of credits.values()) parts.push(renderCredit(credit));

	return parts.join(" ");
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
		[...buckets.get(type).values()].map((entry) => renderEntry(entry, emoji, repoUrl)),
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

// An entry already written in the file: the gitmoji, the description linking its commit, and
// whatever the generator appended after it (issue references, avatars).
// The trailing group is the credit, in either the markup written today or the markdown image link
// the first version of the feature emitted, so re-running only ever replaces it — never doubles it.
const WRITTEN_ENTRY =
	/^(- \S+ \[[^\]]*\]\(\S*?\/commit\/([0-9a-f]{7,40})\).*?)(\s*(?:<span class="changelog-credit">|\[!\[).*)?$/;

/** The identity fields of a commit, from the local clone when it has it, from the API otherwise. */
async function readCommit(hash, repo, token) {
	try {
		// stderr muted: a hash this clone does not have is an expected outcome here, not a failure
		const fields = execFileSync("git", ["log", "-1", `--format=${GIT_COMMIT_FORMAT}`, `${hash}^{commit}`], {
			encoding: "utf8",
			stdio: ["ignore", "pipe", "ignore"],
		});
		return commitFromFields(fields.trim().split("\x1f"));
	} catch {
		// Not in this clone — a shallow checkout, or a commit that only ever lived on a branch that
		// was squashed away. GitHub still has it, and answers with the same fields.
		if (!repo) return null;
		const [author, committer] = commitIdentities(await fetchCommit(repo, hash, token));
		return {
			hash,
			authorName: author.name,
			authorEmail: author.email,
			committerName: committer.name,
			committerEmail: committer.email,
		};
	}
}

/**
 * Rewrites the entries already in the file so they carry the current avatar markup. Only the credit
 * at the end of an entry is touched — the description, its commit link and its issue references are
 * copied over verbatim, so hand-written sections and hand-edited entries survive. An entry whose
 * commit cannot be resolved at all keeps whatever it had.
 *
 * A collapsed entry (one description, several commits) links only one of them, so it is credited to
 * that commit's author alone; the others are lost to the file's format and cannot be recovered here.
 */
async function backfill(file, repoUrl, { useApi, token }) {
	if (!existsSync(file)) {
		console.error(`Error: ${file} does not exist.`);
		process.exit(1);
	}

	const lines = readFileSync(file, "utf8").split("\n");
	const repo = useApi ? apiRepo(repoUrl) : null;

	const commits = new Map();
	for (const line of lines) {
		const hash = WRITTEN_ENTRY.exec(line)?.[2];
		if (!hash || commits.has(hash)) continue;
		try {
			const commit = await readCommit(hash, repo, token);
			if (commit) commits.set(hash, commit);
		} catch (err) {
			console.error(`Could not read commit ${hash}: ${err.message}`);
		}
	}

	const identities = await resolveIdentities([...commits.values()], repoUrl, { useApi, token });

	let credited = 0;
	const rewritten = lines.map((line) => {
		const match = WRITTEN_ENTRY.exec(line);
		if (!match) return line;

		const commit = commits.get(match[2]);
		const credit = commit && creditFor(commit, identities);
		if (!credit) return line;

		credited++;
		return `${match[1]} ${renderCredit(credit)}`;
	});

	writeFileSync(file, rewritten.join("\n"));
	console.error(`Rewrote the credits of ${credited} entries in ${file} (${commits.size} commits).`);
}

async function main() {
	const args = parseArgs(process.argv.slice(2));

	const file = typeof args.file === "string" ? args.file : "CHANGELOG.md";
	const repoUrlArg = typeof args["repo-url"] === "string" ? args["repo-url"].replace(/\/+$/, "") : null;

	if (args.backfill) {
		await backfill(file, repoUrlArg ?? repoUrlFromGit(), { useApi: !args["no-authors"], token: githubToken() });
		return;
	}

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

	// hash + author + committer + subject + body per commit, delimited by the ASCII record/unit
	// separators so multi-line bodies (which is where "Closes #123" lives) survive the split
	const commits = git(["log", range, "--no-merges", `--format=\x1e${GIT_COMMIT_FORMAT}\x1f%s\x1f%b`])
		.split("\x1e")
		.filter((chunk) => chunk.trim())
		.map((chunk) => {
			const fields = chunk.split("\x1f");
			return { ...commitFromFields(fields), subject: (fields[5] ?? "").trim(), body: (fields[6] ?? "").trim() };
		});

	const repoUrl = repoUrlArg ?? repoUrlFromGit();
	const identities = await resolveIdentities(commits, repoUrl, {
		useApi: !args["no-authors"],
		token: githubToken(),
	});

	const { buckets, other } = categorize(commits, identities);

	if (args["list-other"]) {
		// Diagnostic: show the commits that would NOT appear in the changelog,
		// so they can be reviewed and folded in by hand when seeding.
		console.error(`# Uncategorized commits in ${range} (${other.length}):`);
		for (const s of other) console.error(`  - ${s}`);
	}

	const section = renderSection(version, date, buckets, repoUrl);

	if (args.stdout) {
		process.stdout.write(section + "\n");
		return;
	}

	writeFileSync(file, prepend(file, section));
	console.error(`Prepended ${version} (${range}) to ${file}.`);
}

await main();
