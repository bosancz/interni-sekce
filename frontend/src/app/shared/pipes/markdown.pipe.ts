import { Pipe, PipeTransform } from "@angular/core";
import { Marked } from "marked";
import { typographyExtension } from "src/helpers/typography";

const markdown = new Marked({ async: false, breaks: true }, typographyExtension);

@Pipe({
	name: "markdown",
})
export class MarkdownPipe implements PipeTransform {
	transform(value: string | null | undefined, ...args: unknown[]): string {
		if (!value) return "";
		return markdown.parse(value) as string;
	}
}

@Pipe({
	name: "markdownInline",
})
export class MarkdownInlinePipe implements PipeTransform {
	transform(value: string | null | undefined): string {
		if (!value) return "";
		return markdown.parseInline(value) as string;
	}
}
