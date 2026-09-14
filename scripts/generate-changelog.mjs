#!/usr/bin/env node

import { execFileSync } from "node:child_process";
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";

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

const OTHER_TYPE = "non-conventional";
const OTHER = { type: OTHER_TYPE, emoji: "❓" };
const TYPES = [...SECTIONS, OTHER];

const CONVENTIONAL = /^(\w+)(?:\(([^)]*)\))?(!)?:\s*(.+)$/;

const ISSUE_KEYWORD_REF = /(?:close[sd]?|fix(?:e[sd])?|resolve[sd]?|refs?)\s+#(\d+)/gi;
const ISSUE_SUBJECT_REF = /\(#(\d+)\)/g;

const ISSUE_IN_SUBJECT = /\s*[,;–-]?\s*(?:\(#\d+\)|(?:close[sd]?|fix(?:e[sd])?|resolve[sd]?|refs?)\s+#\d+)/gi;

function collectIssues(text, pattern) {
	pattern.lastIndex = 0;
	const issues = [];
	for (let m = pattern.exec(text); m; m = pattern.exec(text)) issues.push(Number(m[1]));
	return issues;
}

const AVATAR_SIZE = 48;

const GITHUB_NOREPLY = /^(?:(\d+)\+)?([A-Za-z\d](?:[A-Za-z\d]|-(?=[A-Za-z\d])){0,38})@users\.noreply\.github\.com$/i;

const BOT_COMMITTER_EMAILS = new Set(["noreply@github.com"]);

const GITHUB_API = "https://api.github.com";

function apiRepo(repoUrl) {
	const match = /^https:\/\/github\.com\/([^/]+)\/([^/]+)$/.exec(repoUrl);
	return match ? { owner: match[1], repo: match[2] } : null;
}

function repoSlug(repoUrl) {
	const repo = apiRepo(repoUrl);
	return repo ? `${repo.owner}/${repo.repo}` : null;
}

function avatarUrl(url) {
	const separator = url.includes("?") ? "&" : "?";
	return `${url}${separator}s=${AVATAR_SIZE}`;
}

function anonymousAuthor(name) {
	return { name, login: null };
}

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

function commitIdentities(data) {
	return ["author", "committer"].map((role) => ({
		name: data.commit?.[role]?.name ?? "",
		email: data.commit?.[role]?.email ?? "",
		login: data[role]?.login ?? null,
		avatar: data[role]?.avatar_url ?? null,
	}));
}

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

function identityKey({ name, login }) {
	return login ? `login:${login.toLowerCase()}` : `name:${name}`;
}

function creditFor({ authorEmail, committerEmail }, identities) {
	const author = identities.get(authorEmail);
	if (!author) return null;

	const committer = BOT_COMMITTER_EMAILS.has(committerEmail) ? null : identities.get(committerEmail);
	const distinct = committer && identityKey(committer) !== identityKey(author);
	return { author, committer: distinct ? committer : null };
}

function describe({ subject, body }) {
	const match = CONVENTIONAL.exec(subject);
	const type = match?.[1].toLowerCase() ?? "";
	const conventional = SECTIONS.some((section) => section.type === type);

	const description = (conventional ? match[4] : subject).replace(ISSUE_IN_SUBJECT, "").trim();

	return {
		type: conventional ? type : OTHER_TYPE,
		text: description.charAt(0).toUpperCase() + description.slice(1),
		issues: [
			...collectIssues(subject, ISSUE_SUBJECT_REF),
			...collectIssues(`${subject}\n${body}`, ISSUE_KEYWORD_REF),
		],
	};
}

function addEntry(entries, { text, issues }, commit, identities) {
	const entry = entries.get(text) ?? { text, hash: commit.hash, issues: new Set(), credits: new Map() };
	for (const issue of issues) entry.issues.add(issue);

	const credit = creditFor(commit, identities);
	if (credit && !entry.credits.has(identityKey(credit.author))) {
		entry.credits.set(identityKey(credit.author), credit);
	}

	entries.set(text, entry);
}

function categorize(commits, identities) {
	const buckets = new Map(TYPES.map((s) => [s.type, new Map()]));
	const described = commits.map((commit) => ({ commit, ...describe(commit) }));

	const typed = new Map();
	for (const item of described.filter((item) => item.type !== OTHER_TYPE)) {
		addEntry(buckets.get(item.type), item, item.commit, identities);
		typed.set(item.text, item.type);
	}

	for (const item of described.filter((item) => item.type === OTHER_TYPE)) {
		addEntry(buckets.get(typed.get(item.text) ?? OTHER_TYPE), item, item.commit, identities);
	}

	return buckets;
}

function escapeMarkdown(text) {
	return text.replace(/([\\`*_[\]()])/g, "\\$1");
}

function unescapeMarkdown(text) {
	return text.replace(/\\([\\`*_[\]()])/g, "$1");
}

function commitsInRange(range) {
	return git(["log", range, "--no-merges", `--format=\x1e${GIT_COMMIT_FORMAT}\x1f%s\x1f%b`])
		.split("\x1e")
		.filter((chunk) => chunk.trim())
		.map((chunk) => {
			const fields = chunk.split("\x1f");
			return { ...commitFromFields(fields), subject: (fields[5] ?? "").trim(), body: (fields[6] ?? "").trim() };
		});
}

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

function renderAvatar({ name, login, avatar }) {
	if (!login) return `<span class="changelog-avatar changelog-initials">${escapeHtml(initials(name))}</span>`;
	return `<img class="changelog-avatar" src="${escapeHtml(avatar)}" alt="${escapeHtml(name)}">`;
}

function renderCredit({ author, committer }) {
	const authorAvatar = renderAvatar(author);
	const parts = [
		author.login
			? `<a class="changelog-author" href="https://github.com/${author.login}">${authorAvatar}</a>`
			: `<span class="changelog-author">${authorAvatar}</span>`,
	];
	if (committer) parts.push(`<span class="changelog-committer">${renderAvatar(committer)}</span>`);

	const title = escapeHtml(committer ? `${author.name} a ${committer.name}` : author.name);

	return `<span class="changelog-credit" title="${title}">${parts.join("")}</span>`;
}

function renderType({ type, emoji }) {
	return `<span class="changelog-type" title="${escapeHtml(type)}">${emoji}</span>`;
}

function renderEntry({ text, hash, issues, credits }, type, repoUrl) {
	const parts = [`- ${renderType(type)} [${escapeMarkdown(text)}](${repoUrl}/commit/${hash})`];

	if (issues.size) {
		const refs = [...issues].sort((a, b) => a - b).map((issue) => `#${issue}`);
		parts.push(`(${refs.join(", ")})`);
	}

	for (const credit of credits.values()) parts.push(renderCredit(credit));

	return parts.join(" ");
}

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

const NO_CHANGES = "_Bez uživatelských změn._";
const PLACEHOLDERS = [NO_CHANGES, "_Interní vylepšení a údržba._"];

function renderSection(version, date, buckets, repoUrl) {
	const lines = [`## ${version} — ${date}`, ""];
	const entries = TYPES.flatMap((type) =>
		[...buckets.get(type.type).values()].map((entry) => renderEntry(entry, type, repoUrl)),
	);

	if (entries.length) lines.push(...entries, "");
	else lines.push(NO_CHANGES, "");

	return lines.join("\n");
}

const DEFAULT_HEADER = "";

function prepend(file, section) {
	let content = existsSync(file) ? readFileSync(file, "utf8") : "";
	if (!content.trim()) content = DEFAULT_HEADER;

	const marker = content.startsWith("## ") ? 0 : content.indexOf("\n## ");
	if (marker === -1) {
		const header = content.replace(/\s*$/, "");
		return header ? `${header}\n\n${section}\n` : `${section}\n`;
	}

	const splitAt = marker === 0 ? 0 : marker + 1;
	const header = content.slice(0, splitAt).replace(/\s*$/, "");
	const rest = content.slice(splitAt);
	return header ? `${header}\n\n${section}\n${rest}` : `${section}\n${rest}`;
}

const WRITTEN_ENTRY =
	/^- (?:<span class="changelog-type"[^>]*>)?(?<emoji>\S+?)(?:<\/span>)? (?<body>\[[^\]]*\]\(\S*?\/commit\/(?<hash>[0-9a-f]{7,40})\).*?)(?:\s*(?:<span class="changelog-credit"|\[!\[).*)?$/;

const TYPE_BY_EMOJI = new Map(TYPES.map((type) => [type.emoji, type]));

async function readCommit(hash, repo, token) {
	try {
		const fields = execFileSync("git", ["log", "-1", `--format=${GIT_COMMIT_FORMAT}`, `${hash}^{commit}`], {
			encoding: "utf8",
			stdio: ["ignore", "pipe", "ignore"],
		});
		return commitFromFields(fields.trim().split("\x1f"));
	} catch {
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

async function backfill(file, repoUrl, { useApi, token }) {
	if (!existsSync(file)) {
		console.error(`Error: ${file} does not exist.`);
		process.exit(1);
	}

	const lines = readFileSync(file, "utf8").split("\n");
	const repo = useApi ? apiRepo(repoUrl) : null;

	const commits = new Map();
	for (const line of lines) {
		const hash = WRITTEN_ENTRY.exec(line)?.groups.hash;
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

		const { emoji, body, hash } = match.groups;
		const commit = commits.get(hash);
		const credit = commit && creditFor(commit, identities);
		if (!credit) return line;

		const type = TYPE_BY_EMOJI.get(emoji);

		credited++;
		return `- ${type ? renderType(type) : emoji} ${body} ${renderCredit(credit)}`;
	});

	writeFileSync(file, rewritten.join("\n"));
	console.error(`Rewrote the credits of ${credited} entries in ${file} (${commits.size} commits).`);
}

const SECTION_HEADING = /^## (\S+)\s+—/;

const LEGACY_DIVIDER = /^---+\s*$/;

function readSections(lines) {
	const sections = [];
	let end = lines.length;

	for (let i = 0; i < lines.length; i++) {
		if (LEGACY_DIVIDER.test(lines[i])) {
			end = i;
			break;
		}
		if (!SECTION_HEADING.test(lines[i])) continue;
		if (sections.length) sections.at(-1).end = i;
		sections.push({ version: SECTION_HEADING.exec(lines[i])[1], start: i, end: lines.length });
	}

	if (sections.length) sections.at(-1).end = end;
	return sections;
}

function tagRange(version) {
	if (!git(["tag", "--list", version])) return null;
	try {
		return `${git(["describe", "--tags", "--abbrev=0", "--match", "v*", `${version}^`])}..${version}`;
	} catch {
		return version;
	}
}

function sectionContents(lines, { start, end }) {
	const texts = new Set();
	const hashes = new Set();

	for (const line of lines.slice(start, end)) {
		const entry = WRITTEN_ENTRY.exec(line)?.groups;
		if (!entry) continue;
		texts.add(unescapeMarkdown(/^\[([^\]]*)\]/.exec(entry.body)?.[1] ?? ""));
		hashes.add(entry.hash);
	}

	const placeholder = lines.slice(start, end).findIndex((line) => PLACEHOLDERS.includes(line.trim()));

	return { texts, hashes, placeholder, generated: hashes.size > 0 || placeholder !== -1 };
}

const RELEASE_ISSUES_FILE = "release-issues.json";

const RENDERED_ENTRY_BODY = /^\[(?<text>[^\]]*)\]\((?<url>[^)]*)\)(?<rest>.*)$/;

const ISSUE_REF = /#(\d+)/g;

// Every issue the changelog has ever recorded, not just the new section's: a release the running
// container never booted (two releases in quick succession) would otherwise never notify anyone.
function collectReleaseIssues(file) {
	const lines = readFileSync(file, "utf8").split("\n");
	const issues = new Map();

	for (const section of readSections(lines)) {
		for (const line of lines.slice(section.start, section.end)) {
			const body = WRITTEN_ENTRY.exec(line)?.groups.body;
			const entry = body && RENDERED_ENTRY_BODY.exec(body)?.groups;
			if (!entry) continue;

			// sections run newest first, so the last write leaves the earliest release that carried the issue
			for (const number of collectIssues(entry.rest, ISSUE_REF)) {
				issues.set(number, { number, version: section.version, text: unescapeMarkdown(entry.text) });
			}
		}
	}

	return [...issues.values()].sort((a, b) => a.number - b.number);
}

function writeReleaseIssues(file, version, date, repoUrl) {
	const target = join(dirname(file), RELEASE_ISSUES_FILE);
	const issues = collectReleaseIssues(file);

	writeFileSync(target, `${JSON.stringify({ version, date, repo: repoSlug(repoUrl), issues }, null, "\t")}\n`);
	console.error(`Wrote ${issues.length} issue references to ${target}.`);
}

async function backfillOther(file, repoUrl, { useApi, token }) {
	if (!existsSync(file)) {
		console.error(`Error: ${file} does not exist.`);
		process.exit(1);
	}

	const lines = readFileSync(file, "utf8").split("\n");
	const sections = readSections(lines);

	const missing = [];
	for (const section of sections) {
		const range = tagRange(section.version);
		const contents = sectionContents(lines, section);
		if (!range || !contents.generated) {
			console.error(`Skipping ${section.version}: ${range ? "not a generated section" : "no such tag"}.`);
			continue;
		}
		missing.push({ ...section, ...contents, commits: commitsInRange(range) });
	}

	const identities = await resolveIdentities(
		missing.flatMap(({ commits }) => commits),
		repoUrl,
		{ useApi, token },
	);

	let added = 0;
	for (const section of [...missing].reverse()) {
		const entries = [...categorize(section.commits, identities).get(OTHER_TYPE).values()]
			.filter((entry) => !section.texts.has(entry.text) && !section.hashes.has(entry.hash))
			.map((entry) => renderEntry(entry, OTHER, repoUrl));
		if (!entries.length) continue;

		const last = lines.slice(section.start, section.end).findLastIndex((line) => line.startsWith("- "));

		if (section.placeholder !== -1) lines.splice(section.start + section.placeholder, 1, ...entries);
		else lines.splice(section.start + last + 1, 0, ...entries);

		added += entries.length;
		console.error(`${section.version}: added ${entries.length} entries.`);
	}

	writeFileSync(file, lines.join("\n"));
	console.error(`Added ${added} non-conventional entries to ${file}.`);
}

async function main() {
	const args = parseArgs(process.argv.slice(2));

	const file = typeof args.file === "string" ? args.file : "CHANGELOG.md";
	const repoUrlArg = typeof args["repo-url"] === "string" ? args["repo-url"].replace(/\/+$/, "") : null;

	if (args.backfill) {
		await backfill(file, repoUrlArg ?? repoUrlFromGit(), { useApi: !args["no-authors"], token: githubToken() });
		return;
	}

	if (args["backfill-other"]) {
		await backfillOther(file, repoUrlArg ?? repoUrlFromGit(), {
			useApi: !args["no-authors"],
			token: githubToken(),
		});
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
			from = null;
		}
	}

	const date = typeof args.date === "string" ? args.date : git(["log", "-1", "--format=%cs", to]);
	const range = from ? `${from}..${to}` : to;
	const commits = commitsInRange(range);

	const repoUrl = repoUrlArg ?? repoUrlFromGit();
	const identities = await resolveIdentities(commits, repoUrl, {
		useApi: !args["no-authors"],
		token: githubToken(),
	});

	const section = renderSection(version, date, categorize(commits, identities), repoUrl);

	if (args.stdout) {
		process.stdout.write(section + "\n");
		return;
	}

	writeFileSync(file, prepend(file, section));
	console.error(`Prepended ${version} (${range}) to ${file}.`);

	writeReleaseIssues(file, version, date, repoUrl);
}

await main();
