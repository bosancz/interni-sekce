import { Directive, TemplateRef } from "@angular/core";

@Directive({
	selector: "[adminCell]",
})
export class AdminTableCellDirective {
	constructor(public readonly template: TemplateRef<{ $implicit: any }>) {}

	static ngTemplateContextGuard(_dir: AdminTableCellDirective, _ctx: unknown): _ctx is { $implicit: any } {
		return true;
	}
}
