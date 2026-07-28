import { Pipe, PipeTransform } from "@angular/core";

/** Repo whose issues the "#123" references point at. `/issues/N` redirects to `/pull/N` for PRs. */
const ISSUE_URL = "https://github.com/bosancz/interni-sekce/issues/";

/**
 * Prepares the rendered changelog for display: "#123" references become links to the GitHub
 * issue, and every link — including the commit links the generator writes around each entry —
 * opens in a new tab.
 *
 * Runs on the HTML produced by {@link MarkdownPipe} (`… | markdown | changelogLinks`).
 */
@Pipe({
	name: "changelogLinks",
})
export class ChangelogLinksPipe implements PipeTransform {
	transform(value: string | null | undefined): string {
		if (!value) return "";
		return openInNewTab(linkIssues(value));
	}
}

/**
 * The pattern alternates with whole tags and whole anchors, so a "#123" inside an attribute or
 * already inside a link is left alone rather than being rewritten or nested.
 */
function linkIssues(html: string): string {
	return html.replace(/<a\b[^>]*>[\s\S]*?<\/a>|<[^>]+>|#(\d+)\b/g, (match, issue?: string) =>
		issue === undefined
			? match
			: `<a class="issue-ref" href="${ISSUE_URL}${issue}" target="_blank" rel="noopener noreferrer">#${issue}</a>`,
	);
}

/** Anchors that already carry a target (the issue links above) are left as they are. */
function openInNewTab(html: string): string {
	return html.replace(/<a\b(?![^>]*\starget=)([^>]*)>/g, '<a$1 target="_blank" rel="noopener noreferrer">');
}
