import { Component, Input } from "@angular/core";

@Component({
	selector: "bo-page-header",
	templateUrl: "./page-header.component.html",
	styleUrls: ["./page-header.component.scss"],
	standalone: false,
})
export class PageHeaderComponent {
	@Input() title?: string | null;

	@Input() backUrl?: string | null;

	viewActive: boolean = false;

	constructor() {}
}
