import { Pipe, PipeTransform } from "@angular/core";
import { marked } from "marked";
@Pipe({
  name: "markdown",
})
export class MarkdownPipe implements PipeTransform {
  transform(value: string | undefined, ...args: unknown[]): string {
    if (!value) return "<span>hoho</span>";
    return marked.parse(value);
  }
}
