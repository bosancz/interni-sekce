import { Component, Input } from "@angular/core";

@Component({
	selector: "bo-member-profile",
	templateUrl: "./member-profile.component.html",
	styleUrl: "./member-profile.component.scss",
	standalone: false,
})
export class MemberProfileComponent {
	@Input() member?: BackendApiTypes.MemberResponseWithLinks | null;
}
