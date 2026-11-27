import { ChangeDetectionStrategy, Component, input } from "@angular/core";
import { AccentAbovePipe } from "src/app/shared/pipes/accent-above.pipe";
import { GroupPipe } from "src/app/shared/pipes/group.pipe";
import { MemberProfilePhotoUrlPipe } from "src/app/shared/pipes/member-profile-photo-url.pipe";
import { MemberPipe } from "src/app/shared/pipes/member.pipe";
import { SDK } from "src/sdk";

@Component({
	selector: "bo-event-leaders-inline",
	templateUrl: "./event-leaders-inline.component.html",
	styleUrl: "./event-leaders-inline.component.scss",
	imports: [AccentAbovePipe, GroupPipe, MemberPipe, MemberProfilePhotoUrlPipe],
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EventLeadersInlineComponent {
	leaders = input<SDK.MemberResponse[] | null | undefined>([]);
}
