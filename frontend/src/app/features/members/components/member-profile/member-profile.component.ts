import { Component, input } from "@angular/core";
import { IonAvatar } from "@ionic/angular/standalone";
import { SDK } from "src/sdk";
import { CardContentComponent } from "../../../../shared/components/card-content/card-content.component";
import { CardComponent } from "../../../../shared/components/card/card.component";
import { MemberPipe } from "../../../../shared/pipes/member.pipe";

@Component({
	selector: "bo-member-profile",
	templateUrl: "./member-profile.component.html",
	styleUrl: "./member-profile.component.scss",
	imports: [CardComponent, CardContentComponent, IonAvatar, MemberPipe],
})
export class MemberProfileComponent {
	member = input<SDK.MemberResponseWithLinks | null | undefined>();
}
