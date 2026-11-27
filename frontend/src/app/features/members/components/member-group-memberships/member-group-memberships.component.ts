import { Component, computed, effect, input, output, signal, untracked } from "@angular/core";
import { toSignal } from "@angular/core/rxjs-interop";
import { IonIcon, IonSkeletonText } from "@ionic/angular/standalone";
import { addIcons } from "ionicons";
import { ellipsisVertical, flagOutline } from "ionicons/icons";
import { ApiService } from "src/app/core/services/api.service";
import { GroupsService } from "src/app/core/services/groups.service";
import { ModalService } from "src/app/core/services/modal.service";
import { ToastService } from "src/app/core/services/toast.service";
import { CardContentComponent } from "src/app/shared/components/card-content/card-content.component";
import { CardHeaderComponent } from "src/app/shared/components/card-header/card-header.component";
import { CardTitleComponent } from "src/app/shared/components/card-title/card-title.component";
import { CardComponent } from "src/app/shared/components/card/card.component";
import {
	DropdownMenuComponent,
	DropdownMenuOption,
} from "src/app/shared/components/dropdown-menu/dropdown-menu.component";
import { GroupBadgeComponent } from "src/app/shared/components/group-badge/group-badge.component";
import { SDK } from "src/sdk";
import {
	GroupMembershipModalComponent,
	GroupMembershipModalMode,
} from "../group-membership-modal/group-membership-modal.component";

@Component({
	selector: "bo-member-group-memberships",
	templateUrl: "./member-group-memberships.component.html",
	styleUrl: "./member-group-memberships.component.scss",
	imports: [
		CardComponent,
		CardHeaderComponent,
		CardTitleComponent,
		CardContentComponent,
		IonIcon,
		IonSkeletonText,
		DropdownMenuComponent,
		GroupBadgeComponent,
	],
})
export class MemberGroupMembershipsComponent {
	member = input<SDK.MemberResponseWithLinks | null | undefined>();
	reload = output<void>();

	groupMemberships = signal<SDK.GroupMembershipResponseWithLinks[] | undefined>(undefined);

	readonly currentYear = new Date().getFullYear();

	private readonly groups = toSignal(this.groupsService.groups, { initialValue: [] });

	timeline = computed(() =>
		[...(this.groupMemberships() ?? [])].sort((a, b) => sortKey(a) - sortKey(b) || a.id - b.id),
	);

	activeMembership = computed(() => this.groupMemberships()?.find((membership) => membership.active) ?? null);

	menuOptions = computed<DropdownMenuOption[]>(() => {
		const canCreate = !!this.member()?._links?.createGroupMembership?.allowed;
		const active = this.activeMembership();
		const groups = this.groups();
		const activeGroup = groups.find((group) => group.id === active?.groupId);
		const options: DropdownMenuOption[] = [];

		if (canCreate && activeGroup?.children) {
			for (const group of groups.filter((g) => g.active && !g.children && g.id !== activeGroup.id))
				options.push({
					value: `move:${group.id}`,
					label: `Přesunout do oddílu ${group.name ?? group.shortName}`,
					bold: true,
				});
		}
		if (canCreate)
			options.push({ value: "move", label: active ? "Přesunout do jiného oddílu…" : "Přidat do oddílu…" });
		if (active?._links.updateGroupMembership.allowed) options.push({ value: "end", label: "Ukončit členství" });
		if (canCreate)
			options.push({ value: "history", label: "Doplnit starší členství", divider: options.length > 0 });

		return options;
	});

	constructor(
		private readonly api: ApiService,
		private readonly modalService: ModalService,
		private readonly toastService: ToastService,
		private readonly groupsService: GroupsService,
	) {
		addIcons({ flagOutline, ellipsisVertical });
		effect(() => {
			const memberId = this.member()?.id ?? null;
			untracked(() => this.loadGroupMemberships(memberId));
		});
	}

	canEdit(membership: SDK.GroupMembershipResponseWithLinks) {
		return membership._links.updateGroupMembership.allowed || membership._links.deleteGroupMembership.allowed;
	}

	async onMenu(value: string) {
		if (value.startsWith("move:")) return this.moveTo(Number(value.slice(5)));
		if (value === "move") return this.openGroupMembership(null, "move");
		if (value === "history") return this.openGroupMembership(null, "history");
		if (value === "end") return this.endActive();
	}

	async editGroupMembership(membership: SDK.GroupMembershipResponseWithLinks) {
		if (!this.canEdit(membership)) return;
		await this.openGroupMembership(membership, "edit");
	}

	formatYears(membership: SDK.GroupMembershipResponse) {
		if (membership.active) return membership.yearFrom === null ? "aktivní" : `od ${membership.yearFrom}`;
		if (membership.yearTill === null) return membership.yearFrom === null ? "dříve" : `${membership.yearFrom}–?`;
		if (membership.yearFrom === null) return `do ${membership.yearTill}`;
		if (membership.yearTill === membership.yearFrom) return String(membership.yearFrom);
		return `${membership.yearFrom}–${membership.yearTill}`;
	}

	private async loadGroupMemberships(memberId: number | null) {
		if (!memberId) {
			this.groupMemberships.set(undefined);
			return;
		}
		const res = await this.api.MembersApi.listGroupMemberships(memberId);
		this.groupMemberships.set(res.data);
	}

	private async moveTo(groupId: number) {
		const member = this.member();
		if (!member) return;
		const active = this.activeMembership();
		const message = active
			? `Přesunout do oddílu ${this.groupName(groupId)}? Členství v oddílu ${this.groupName(active.groupId)} se ukončí rokem ${this.currentYear}.`
			: `Přidat do oddílu ${this.groupName(groupId)}?`;
		if (!(await this.modalService.confirmationModal(message))) return;

		await this.save(
			member.id,
			() =>
				this.api.MembersApi.createGroupMembership(member.id, {
					groupId,
					yearFrom: this.currentYear,
					active: true,
				}),
			`Přesunuto do oddílu ${this.groupName(groupId)}`,
		);
	}

	private async endActive() {
		const member = this.member();
		const active = this.activeMembership();
		if (!member || !active) return;
		const confirmed = await this.modalService.confirmationModal(
			`Ukončit členství v oddílu ${this.groupName(active.groupId)} rokem ${this.currentYear}? Člen pak nebude aktivní.`,
		);
		if (!confirmed) return;

		await this.save(
			member.id,
			() =>
				this.api.MembersApi.updateGroupMembership(member.id, active.id, {
					active: false,
					yearTill: Math.max(this.currentYear, active.yearFrom ?? this.currentYear),
				}),
			"Členství v oddílu bylo ukončeno",
		);
	}

	private async save(memberId: number, request: () => Promise<unknown>, successMessage: string) {
		try {
			await request();
			await this.toastService.toast(successMessage);
		} catch (err) {
			const message = (err as { response?: { data?: { message?: string } } }).response?.data?.message;
			await this.toastService.toast(message ?? "Členství v oddílu se nepodařilo uložit.", { color: "danger" });
		}
		await this.loadGroupMemberships(memberId);
		this.reload.emit();
	}

	private groupName(groupId: number) {
		const group = this.groups().find((g) => g.id === groupId);
		return group?.name ?? group?.shortName ?? "";
	}

	private async openGroupMembership(
		membership: SDK.GroupMembershipResponseWithLinks | null,
		mode: GroupMembershipModalMode,
	) {
		const member = this.member();
		if (!member) return;

		const result = await this.modalService.componentModal(
			GroupMembershipModalComponent,
			{ membership, mode, activeGroupId: member.groupId ?? null },
			{ cssClass: "dialog-brand" },
		);
		if (!result) return;

		try {
			if (result.kind === "delete" && membership) {
				const confirmed = await this.modalService.deleteConfirmationModal(
					"Opravdu smazat toto členství v oddílu?",
				);
				if (!confirmed) return;
				await this.api.MembersApi.deleteGroupMembership(member.id, membership.id);
				await this.toastService.toast("Členství v oddílu bylo smazáno", { color: "danger" });
			} else if (result.kind === "save" && membership) {
				await this.api.MembersApi.updateGroupMembership(member.id, membership.id, result.data);
				await this.toastService.toast("Členství v oddílu bylo upraveno");
			} else if (result.kind === "save") {
				await this.api.MembersApi.createGroupMembership(member.id, result.data);
				await this.toastService.toast("Členství v oddílu bylo přidáno");
			}
		} catch (err) {
			const message = (err as { response?: { data?: { message?: string } } }).response?.data?.message;
			await this.toastService.toast(message ?? "Členství v oddílu se nepodařilo uložit.", { color: "danger" });
		}

		await this.loadGroupMemberships(member.id);
		this.reload.emit();
	}
}

function sortKey(membership: SDK.GroupMembershipResponse) {
	if (membership.active) return Number.MAX_SAFE_INTEGER;
	return membership.yearTill ?? membership.yearFrom ?? Number.MIN_SAFE_INTEGER;
}
