import { Component, EventEmitter, Input, Output } from "@angular/core";
import { MemberRoles } from "src/app/config/member-roles";
import { MembershipStates } from "src/app/config/membership-states";
import { ApiService } from "src/app/services/api.service";
import { ModalService } from "src/app/services/modal.service";
import { SDK } from "src/sdk";

@Component({
	selector: "bo-member-membership",
	standalone: false,
	templateUrl: "./member-membership.component.html",
	styleUrl: "./member-membership.component.scss",
})
export class MemberMembershipComponent {
	@Input() member?: SDK.MemberResponseWithLinks | null;
	@Output() update = new EventEmitter<Partial<SDK.MemberResponse>>();

	memberRolesOptions = Object.entries(MemberRoles).map(([id, role]) => ({
		label: role.title,
		value: id as SDK.MemberRolesEnum,
	}));

	constructor(
		private readonly api: ApiService,
		private readonly modalService: ModalService,
	) {}

	async editActivity() {
		const result = await this.modalService.selectModal({
			header: "Změnit aktivitu",
			buttonText: "Uložit",
			values: [
				{ label: "Aktivní", value: true },
				{ label: "Neaktivní", value: false },
			],
			value: this.member?.active,
		});

		if (result !== null) this.update.emit({ active: result });
	}

	async editRole() {
		const role = await this.modalService.selectModal<SDK.MemberRolesEnum>({
			header: "Změnit roli",
			buttonText: "Uložit",
			values: Object.entries(MemberRoles).map(([id, role]) => ({
				label: role.title,
				value: id as SDK.MemberRolesEnum,
				checked: this.member?.role === id,
			})),
			value: this.member?.role,
		});

		if (role !== null) this.update.emit({ role });
	}

	async editGroup() {
		const groups = await this.api.MembersApi.listGroups({ active: true }).then((res) => res.data);
		groups.sort((a, b) => a.shortName.localeCompare(b.shortName, "cs", { numeric: true }));

		const group = await this.modalService.selectModal({
			header: "Změnit skupinu",
			buttonText: "Uložit",
			values: groups.map((g) => ({ label: g.name ?? g.shortName, value: g.id })),
			value: this.member?.groupId,
		});

		if (group !== null) this.update.emit({ groupId: group });
	}

	async editMembership() {
		const result = await this.modalService.selectModal({
			header: "Změnit aktivitu",
			buttonText: "Uložit",
			values: Object.entries(MembershipStates).map(([id, role]) => ({
				label: role.title,
				value: id as SDK.MembershipStatesEnum,
				checked: this.member?.role === id,
			})),
			value: this.member?.membership,
		});

		if (result !== null) this.update.emit({ membership: result });
	}
}
