import { Pipe, PipeTransform } from "@angular/core";
import { marked } from "marked";

@Pipe({
	name: "markdown",
})
export class MarkdownPipe implements PipeTransform {
	transform(value: string | null | undefined, ...args: unknown[]): string {
		if (!value) return "";
		return marked.parse(value, { async: false, breaks: true }) as string;
	}
}
