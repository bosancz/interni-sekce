import { Component, input } from "@angular/core";
import { IonAvatar } from "@ionic/angular/standalone";
import { SDK } from "src/sdk";
import { MemberPipe } from "../../../../shared/pipes/member.pipe";

@Component({
	selector: "bo-member-profile",
	templateUrl: "./member-profile.component.html",
	styleUrl: "./member-profile.component.scss",
	imports: [IonAvatar, MemberPipe],
})
export class MemberProfileComponent {
	member = input<SDK.MemberResponseWithLinks | null | undefined>();
}
