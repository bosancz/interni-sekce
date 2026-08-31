import { Component, input, output } from "@angular/core";
import { IonIcon, IonSkeletonText } from "@ionic/angular/standalone";
import { addIcons } from "ionicons";
import { peopleOutline } from "ionicons/icons";
import { MemberRoles } from "src/app/core/config/member-roles";
import { MembershipPaymentStates } from "src/app/core/config/membership";
import { currentMembershipYear, isMembershipPaid, setMembershipPaid } from "src/app/core/helpers/membership";
import { ApiService } from "src/app/core/services/api.service";
import { ModalService } from "src/app/core/services/modal.service";
import { SDK } from "src/sdk";
import { CardContentComponent } from "../../../../shared/components/card-content/card-content.component";
import { CardHeaderComponent } from "../../../../shared/components/card-header/card-header.component";
import { CardTitleComponent } from "../../../../shared/components/card-title/card-title.component";
import { CardComponent } from "../../../../shared/components/card/card.component";
import { EditButtonComponent } from "../../../../shared/components/edit-button/edit-button.component";
import { GroupBadgeComponent } from "../../../../shared/components/group-badge/group-badge.component";
import { MemberPipe } from "../../../../shared/pipes/member.pipe";

@Component({
	selector: "bo-member-membership",

	imports: [
		CardComponent,
		CardHeaderComponent,
		CardTitleComponent,
		CardContentComponent,
		IonIcon,
		IonSkeletonText,
		EditButtonComponent,
		GroupBadgeComponent,
		MemberPipe,
	],
	templateUrl: "./member-membership.component.html",
	styleUrl: "./member-membership.component.scss",
})
export class MemberMembershipComponent {
	member = input<SDK.MemberResponseWithLinks | null | undefined>();
	update = output<Partial<SDK.MemberResponse>>();

	memberRolesOptions = Object.entries(MemberRoles).map(([id, role]) => ({
		label: role.title,
		value: id as SDK.MemberRolesEnum,
	}));

	// The membership year the card shows and edits.
	membershipYear = currentMembershipYear();

	constructor(
		private readonly api: ApiService,
		private readonly modalService: ModalService,
	) {
		addIcons({ peopleOutline });
	}

	async editActivity() {
		const member = this.member();
		const result = await this.modalService.selectModal({
			header: "Změnit aktivitu",
			buttonText: "Uložit",
			values: [
				{ label: "Aktivní", value: true },
				{ label: "Neaktivní", value: false },
			],
			value: member?.active,
		});

		if (result !== null) this.update.emit({ active: result });
	}

	async editRole() {
		const member = this.member();
		const role = await this.modalService.selectModal<SDK.MemberRolesEnum>({
			header: "Změnit roli",
			buttonText: "Uložit",
			values: Object.entries(MemberRoles).map(([id, role]) => ({
				label: role.title,
				value: id as SDK.MemberRolesEnum,
				checked: member?.role === id,
			})),
			value: member?.role,
		});

		if (role !== null) this.update.emit({ role });
	}

	async editGroup() {
		const member = this.member();
		const groups = await this.api.MembersApi.listGroups({ active: true }).then((res) => res.data);
		groups.sort((a, b) => a.shortName.localeCompare(b.shortName, "cs", { numeric: true }));

		const group = await this.modalService.selectModal({
			header: "Změnit oddíl",
			buttonText: "Uložit",
			values: groups.map((g) => ({ label: g.name ?? g.shortName, value: g.id })),
			value: member?.groupId,
		});

		if (group !== null) this.update.emit({ groupId: group });
	}

	async editMembership() {
		const member = this.member();
		const paid = isMembershipPaid(member?.membership, this.membershipYear);

		const result = await this.modalService.selectModal<boolean>({
			header: `Členský příspěvek ${this.membershipYear}`,
			buttonText: "Uložit",
			values: [
				{ label: MembershipPaymentStates.zaplaceno.title, value: true },
				{ label: MembershipPaymentStates.nezaplaceno.title, value: false },
			],
			value: paid,
		});

		// Only the current year changes; the rest of the preallocated years stay as they are.
		if (result !== null)
			this.update.emit({ membership: setMembershipPaid(member?.membership, result, this.membershipYear) });
	}
}
