import { Component, EventEmitter, Input, Output } from "@angular/core";
import { SDK } from "src/sdk";

@Component({
	selector: "bo-member-contact",
	standalone: false,
	templateUrl: "./member-contact.component.html",
	styleUrl: "./member-contact.component.scss",
})
export class MemberContactComponent {
	@Input() member?: SDK.MemberResponseWithLinks | null;
	@Output() update = new EventEmitter<Partial<SDK.MemberResponse>>();

	constructor() {}
}
