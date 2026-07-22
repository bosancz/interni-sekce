import { Directive, TemplateRef } from "@angular/core";

/**
 * Marks the template that renders a column's cell. The row is exposed as the
 * implicit context, so consumers write `<ng-container *adminCell="let row">`.
 */
@Directive({
	selector: "[adminCell]",
})
export class AdminTableCellDirective {
	constructor(public readonly template: TemplateRef<{ $implicit: any }>) {}

	// Lets the template's `let row` be typed instead of falling back to `any`-only.
	static ngTemplateContextGuard(
		_dir: AdminTableCellDirective,
		_ctx: unknown,
	): _ctx is { $implicit: any } {
		return true;
	}
}
