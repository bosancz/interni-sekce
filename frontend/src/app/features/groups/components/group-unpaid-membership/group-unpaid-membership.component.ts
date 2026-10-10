import { Component, computed, input } from "@angular/core";
import { RouterLink } from "@angular/router";
import { IonButton, IonIcon } from "@ionic/angular/standalone";
import { addIcons } from "ionicons";
import { chevronForwardOutline, walletOutline } from "ionicons/icons";
import { currentMembershipYear, isMembershipPaid } from "src/app/core/helpers/membership";
import { CardContentComponent } from "src/app/shared/components/card-content/card-content.component";
import { CardHeaderComponent } from "src/app/shared/components/card-header/card-header.component";
import { CardTitleComponent } from "src/app/shared/components/card-title/card-title.component";
import { CardComponent } from "src/app/shared/components/card/card.component";
import { MemberPipe } from "src/app/shared/pipes/member.pipe";
import { SDK } from "src/sdk";

export function getUnpaidMembers(
	members: SDK.MemberResponseWithLinks[] | undefined,
	year: number = currentMembershipYear(),
): SDK.MemberResponseWithLinks[] {
	return (members ?? [])
		.filter((member) => member.active && !isMembershipPaid(member.membership, year))
		.sort((a, b) => (a.nickname || a.firstName || "").localeCompare(b.nickname || b.firstName || "", "cs"));
}

@Component({
	selector: "bo-group-unpaid-membership",
	templateUrl: "./group-unpaid-membership.component.html",
	styleUrls: ["./group-unpaid-membership.component.scss"],
	imports: [
		CardComponent,
		CardHeaderComponent,
		CardTitleComponent,
		CardContentComponent,
		IonIcon,
		IonButton,
		RouterLink,
		MemberPipe,
	],
})
export class GroupUnpaidMembershipComponent {
	members = input<SDK.MemberResponseWithLinks[] | undefined>(undefined);

	color = input<string | undefined>(undefined);

	year = currentMembershipYear();

	unpaidMembers = computed(() => getUnpaidMembers(this.members(), this.year));

	constructor() {
		addIcons({ walletOutline, chevronForwardOutline });
	}
}
