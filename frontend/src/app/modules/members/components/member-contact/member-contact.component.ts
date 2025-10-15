import { Component, EventEmitter, Input, Output } from "@angular/core";

@Component({
	selector: "bo-member-contact",
	standalone: false,
	templateUrl: "./member-contact.component.html",
	styleUrl: "./member-contact.component.scss",
})
export class MemberContactComponent {
	@Input() member?: BackendApiTypes.MemberResponseWithLinks | null;
	@Output() update = new EventEmitter<Partial<BackendApiTypes.MemberResponse>>();

	constructor() {}
}
