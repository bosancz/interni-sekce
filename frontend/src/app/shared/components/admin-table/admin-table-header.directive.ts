import { Directive, TemplateRef } from "@angular/core";

/**
 * Optional custom header content for a column (e.g. an inline filter select).
 * When omitted, the column falls back to its plain `header` text input.
 */
@Directive({
	selector: "[adminHeader]",
})
export class AdminTableHeaderDirective {
	constructor(public readonly template: TemplateRef<unknown>) {}
}
