import { Pipe, PipeTransform } from "@angular/core";
import { marked } from "marked";
@Pipe({
  name: "markdown",
  standalone: false,
})
export class MarkdownPipe implements PipeTransform {
  transform(value: string | null | undefined, ...args: unknown[]): string {
    if (!value) return "<span>hoho</span>";
    return marked.parse(value, { async: false }) as string;
  }
}
