import { Component, computed, input, output, signal } from "@angular/core";
import { IonIcon, IonSkeletonText } from "@ionic/angular/standalone";
import { addIcons } from "ionicons";
import { chevronBackOutline, chevronForwardOutline, peopleOutline } from "ionicons/icons";
import { MemberRoles } from "src/app/core/config/member-roles";
import { MembershipPaymentStates } from "src/app/core/config/membership";
import { currentMembershipYear, isMembershipPaid, membershipState } from "src/app/core/helpers/membership";
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
	update = output<SDK.MemberUpdateBody>();
	/** One year of the membership fee — the page saves it through its own treasurer-only route. */
	updateMembership = output<SDK.MemberMembershipUpdateBody>();

	memberRolesOptions = Object.entries(MemberRoles).map(([id, role]) => ({
		label: role.title,
		value: id as SDK.MemberRolesEnum,
	}));

	readonly currentYear = currentMembershipYear();
	readonly membershipYear = signal(this.currentYear);

	readonly minYear = computed(() =>
		Math.min(this.currentYear - 1, ...(this.member()?.membership ?? []).map((payment) => payment.forYear)),
	);
	readonly canStepBack = computed(() => this.membershipYear() > this.minYear());
	readonly canStepForward = computed(() => this.membershipYear() < this.currentYear);

	readonly membershipTitle = computed(() => {
		const member = this.member();
		if (!member) return "-";
		return MembershipPaymentStates[membershipState(member.membership, this.membershipYear())].title;
	});

	constructor(
		private readonly api: ApiService,
		private readonly modalService: ModalService,
	) {
		addIcons({ peopleOutline, chevronBackOutline, chevronForwardOutline });
	}

	stepYear(delta: number) {
		const year = this.membershipYear() + delta;
		if (year < this.minYear() || year > this.currentYear) return;
		this.membershipYear.set(year);
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
		const year = this.membershipYear();
		const paid = isMembershipPaid(member?.membership, year);

		const result = await this.modalService.selectModal<boolean>({
			header: `Členský příspěvek ${year}`,
			buttonText: "Uložit",
			values: [
				{ label: MembershipPaymentStates.zaplaceno.title, value: true },
				{ label: MembershipPaymentStates.nezaplaceno.title, value: false },
			],
			value: paid,
		});

		if (result !== null) this.updateMembership.emit({ year, paid: result });
	}
}
