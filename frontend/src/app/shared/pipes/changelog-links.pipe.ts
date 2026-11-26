import { Pipe, PipeTransform } from "@angular/core";

const ISSUE_URL = "https://github.com/bosancz/interni-sekce/issues/";

@Pipe({
	name: "changelogLinks",
})
export class ChangelogLinksPipe implements PipeTransform {
	transform(value: string | null | undefined): string {
		if (!value) return "";
		return markPatchVersions(openInNewTab(linkIssues(value)));
	}
}

function linkIssues(html: string): string {
	return html.replace(/<a\b[^>]*>[\s\S]*?<\/a>|<[^>]+>|#(\d+)\b/g, (match, issue?: string) =>
		issue === undefined
			? match
			: `<a class="issue-ref" href="${ISSUE_URL}${issue}" target="_blank" rel="noopener noreferrer">#${issue}</a>`,
	);
}

function openInNewTab(html: string): string {
	return html.replace(/<a\b(?![^>]*\starget=)([^>]*)>/g, '<a$1 target="_blank" rel="noopener noreferrer">');
}

function markPatchVersions(html: string): string {
	return html.replace(/<h2\b([^>]*)>(\s*v\d+\.\d+\.[1-9]\d*\b)/g, '<h2$1 class="changelog-patch">$2');
}
