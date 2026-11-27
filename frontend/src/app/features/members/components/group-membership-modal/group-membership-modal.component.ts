import { Component, computed, OnInit, signal } from "@angular/core";
import { toSignal } from "@angular/core/rxjs-interop";
import { FormsModule } from "@angular/forms";
import { IonIcon, ModalController } from "@ionic/angular/standalone";
import { addIcons } from "ionicons";
import { trashOutline } from "ionicons/icons";
import { GroupsService } from "src/app/core/services/groups.service";
import { InputModalComponent } from "src/app/core/services/modal.service";
import { GroupsSelectComponent } from "src/app/shared/components/groups-select/groups-select.component";
import { ModalLayoutComponent } from "src/app/shared/components/modal-layout/modal-layout.component";
import { SDK } from "src/sdk";

export interface GroupMembershipFormData {
	groupId: number;
	yearFrom: number | null;
	yearTill: number | null;
	active: boolean;
}

export type GroupMembershipModalMode = "edit" | "move" | "history";

export type GroupMembershipModalResult = { kind: "save"; data: GroupMembershipFormData } | { kind: "delete" };

@Component({
	selector: "bo-group-membership-modal",
	templateUrl: "./group-membership-modal.component.html",
	styleUrl: "./group-membership-modal.component.scss",
	imports: [IonIcon, ModalLayoutComponent, GroupsSelectComponent, FormsModule],
})
export class GroupMembershipModalComponent extends InputModalComponent<GroupMembershipModalResult> implements OnInit {
	membership: SDK.GroupMembershipResponseWithLinks | null = null;
	mode: GroupMembershipModalMode = "move";
	activeGroupId: number | null = null;

	readonly currentYear = new Date().getFullYear();

	private readonly groups = toSignal(this.groupsService.groups, { initialValue: [] });

	groupId = signal<number | null>(null);
	yearFrom = signal<string>("");
	yearTill = signal<string>("");
	ongoing = signal(true);

	error = signal<string | null>(null);

	isNew = computed(() => !this.membership);
	canEdit = computed(() => !this.membership || this.membership._links.updateGroupMembership.allowed);
	canDelete = computed(() => !!this.membership?._links.deleteGroupMembership.allowed);

	title = "";

	get saveLabel() {
		if (this.mode === "edit") return "Uložit";
		return this.mode === "move" && this.activeGroupId !== null ? "Přesunout" : "Přidat";
	}

	constructor(
		modalController: ModalController,
		private readonly groupsService: GroupsService,
	) {
		super(modalController);
		addIcons({ trashOutline });
	}

	ngOnInit(): void {
		if (this.membership) {
			this.groupId.set(this.membership.groupId);
			this.yearFrom.set(this.membership.yearFrom !== null ? String(this.membership.yearFrom) : "");
			this.yearTill.set(this.membership.yearTill !== null ? String(this.membership.yearTill) : "");
			this.ongoing.set(this.membership.active);
			this.title = "Upravit členství v oddílu";
		} else if (this.mode === "history") {
			this.ongoing.set(false);
			this.title = "Doplnit starší členství";
		} else {
			this.yearFrom.set(String(this.currentYear));
			this.yearTill.set(String(this.currentYear));
			this.title = this.activeGroupId !== null ? "Přesunout do oddílu" : "Přidat do oddílu";
		}
	}

	setOngoing(ongoing: boolean) {
		this.ongoing.set(ongoing);
		if (!ongoing && this.isNew() && !this.yearTill()) this.yearTill.set(String(this.currentYear));
		this.error.set(null);
	}

	closesActive = computed(
		() =>
			this.isNew() &&
			this.ongoing() &&
			this.activeGroupId !== null &&
			this.groupId() !== null &&
			this.groupId() !== undefined,
	);

	save() {
		const groupId = this.groupId();
		const yearFrom = this.yearFrom() ? Number(this.yearFrom()) : null;
		const yearTill = !this.ongoing() && this.yearTill() ? Number(this.yearTill()) : null;

		if (!groupId) return this.error.set("Vyber oddíl.");
		if (yearFrom !== null && (!Number.isInteger(yearFrom) || yearFrom < 1900 || yearFrom > 2200))
			return this.error.set("Rok od není platný rok.");
		if (yearTill !== null && (!Number.isInteger(yearTill) || yearTill < 1900 || yearTill > 2200))
			return this.error.set("Rok do není platný rok.");
		if (yearFrom !== null && yearTill !== null && yearTill < yearFrom)
			return this.error.set("Rok do nemůže být dřív než rok od.");

		this.submit.emit({ kind: "save", data: { groupId, yearFrom, yearTill, active: this.ongoing() } });
	}

	remove() {
		this.submit.emit({ kind: "delete" });
	}

	groupName(groupId: number | null) {
		const group = this.groups().find((g) => g.id === groupId);
		return group?.name ?? group?.shortName ?? "";
	}
}
