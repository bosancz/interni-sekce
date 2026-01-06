import { Component, Input } from "@angular/core";
import { SDK } from "src/sdk";

@Component({
	selector: "bo-member-profile",
	templateUrl: "./member-profile.component.html",
	styleUrl: "./member-profile.component.scss",
	
	imports: [],
})
export class MemberProfileComponent {
	@Input() member?: SDK.MemberResponseWithLinks | null;
}
