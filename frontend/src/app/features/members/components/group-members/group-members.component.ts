import { DatePipe, KeyValue, KeyValuePipe, NgTemplateOutlet } from "@angular/common";
import { Component, computed, inject, OnInit, signal } from "@angular/core";
import { FormsModule } from "@angular/forms";
import {
	IonButton,
	IonCheckbox,
	IonContent,
	IonIcon,
	IonItem,
	IonItemDivider,
	IonList,
	IonPopover,
	IonToggle,
} from "@ionic/angular/standalone";
import { UntilDestroy, untilDestroyed } from "@ngneat/until-destroy";
import { addIcons } from "ionicons";
import { arrowUndoOutline, eyeOutline, trashOutline } from "ionicons/icons";

const COLUMNS_ICON =
	"data:image/svg+xml;utf8," +
	'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">' +
	'<rect x="64" y="80" width="384" height="352" rx="24" fill="none" stroke="currentColor" stroke-width="32"/>' +
	'<line x1="192" y1="80" x2="192" y2="432" stroke="currentColor" stroke-width="32"/>' +
	'<line x1="320" y1="80" x2="320" y2="432" stroke="currentColor" stroke-width="32"/></svg>';

import { MemberRoles } from "src/app/core/config/member-roles";
import { MembershipStates } from "src/app/core/config/membership-states";
import { ApiService } from "src/app/core/services/api.service";
import { ModalService } from "src/app/core/services/modal.service";
import { PlatformService } from "src/app/core/services/platform.service";
import { ToastService } from "src/app/core/services/toast.service";
import { Action } from "src/app/shared/components/action-buttons/action-buttons.component";
import { AdminTableCellDirective } from "src/app/shared/components/admin-table/admin-table-cell.directive";
import { AdminTableColumnComponent } from "src/app/shared/components/admin-table/admin-table-column.component";
import { AdminTableComponent, AdminTableSort } from "src/app/shared/components/admin-table/admin-table.component";
import { FilterPillComponent, FilterPillOption } from "src/app/shared/components/filter-pill/filter-pill.component";
import { SortOption, SortSelectComponent } from "src/app/shared/components/sort-select/sort-select.component";
import { FilterComponent } from "src/app/shared/components/filter/filter.component";
import { FilterModel, FilterValues } from "src/app/shared/components/filter/filter-model";
import { TooltipDirective } from "src/app/shared/directives/tooltip.directive";
import { DefaultContactPipe } from "src/app/shared/pipes/default-contact.pipe";
import { MemberPipe } from "src/app/shared/pipes/member.pipe";
import { SDK } from "src/sdk";
import { GroupsService } from "../../services/groups.service";

@UntilDestroy()
@Component({
	selector: "bo-group-members",
	templateUrl: "./group-members.component.html",
	styleUrls: ["./group-members.component.scss"],
	imports: [
		FilterComponent,
		FilterPillComponent,
		SortSelectComponent,
		IonContent,
		IonList,
		IonItem,
		IonItemDivider,
		IonButton,
		IonPopover,
		IonCheckbox,
		IonToggle,
		IonIcon,
		AdminTableComponent,
		AdminTableColumnComponent,
		AdminTableCellDirective,
		FormsModule,
		KeyValuePipe,
		DatePipe,
		NgTemplateOutlet,
		MemberPipe,
		DefaultContactPipe,
		TooltipDirective,
	],
	providers: [FilterModel],
})
export class GroupMembersComponent implements OnInit {
	members = signal<SDK.MemberResponseWithLinks[] | undefined>(undefined);

	roles = MemberRoles;
	membershipStates = MembershipStates;

	private model = inject(FilterModel);
	private readonly defaultFilter: FilterValues = {
		roles: [],
		membership: [],
		showInactive: false,
		sort: "role",
		order: "DESC",
	};
	private applied = signal<FilterValues>(this.defaultFilter);

	selectedRoles = computed(() => this.asArray(this.model.value("roles")));
	selectedMembership = computed(() => this.asArray(this.model.value("membership")));

	sortColumn = computed<string | null>(() => (this.model.value("sort") as string) ?? null);
	sortOrder = computed<"ASC" | "DESC">(() => (this.model.value("order") === "ASC" ? "ASC" : "DESC"));

	readonly sortOptions: SortOption[] = [
		{ key: "nickname", label: "Přezdívka" },
		{ key: "name", label: "Jméno" },
		{ key: "role", label: "Role" },
		{ key: "age", label: "Věk" },
		{ key: "membership", label: "Členství" },
		{ key: "birthday", label: "Datum narození" },
		{ key: "city", label: "Město" },
		{ key: "street", label: "Ulice" },
		{ key: "status", label: "Stav" },
	];
	showInactive = computed(() => !!this.model.value("showInactive"));
	search = signal<string>("");

	private groupId?: number;
	private latestLoadId = 0;

	readonly roleOptions: FilterPillOption[] = Object.entries(MemberRoles).map(([key, role]) => ({
		value: key,
		label: role.title,
	}));
	readonly membershipOptions: FilterPillOption[] = Object.entries(MembershipStates).map(([key, state]) => ({
		value: key,
		label: state.title,
	}));

	viewSelections = signal<{ [key: string]: boolean }>({
		nickname: true,
		name: true,
		role: true,
		age: true,
		membership: false,
		birthday: false,
		addressCity: false,
		addressStreet: false,
		firstTelephone: false,
		firstEmail: false,
		status: false,
	});

	isDesktop = signal(true);

	rowLink = (member: SDK.MemberResponseWithLinks) => ["/databaze/clenove", member.id];
	rowClass = (member: SDK.MemberResponseWithLinks) => ({
		"member-inactive": !member.active,
		"member-paused": member.membership === "pozastaveno",
		"member-vedouci": member.role === "vedouci",
		"member-instruktor": member.role === "instruktor",
	});
	rowActionsHeader = (member: SDK.MemberResponseWithLinks) => member.nickname || member.firstName;

	memberActions = (member: SDK.MemberResponseWithLinks): Action[] => [
		{
			text: "Smazat",
			role: "destructive",
			color: "danger",
			icon: trashOutline,
			hidden: !member._links.deleteMember.allowed,
			handler: () => this.deleteMember(member),
		},
		{
			text: "Obnovit",
			role: "destructive",
			color: "success",
			icon: arrowUndoOutline,
			hidden: !member._links.restoreMember.allowed,
			handler: () => this.restoreMember(member),
		},
	];

	constructor(
		private api: ApiService,
		private groupsService: GroupsService,
		private modalService: ModalService,
		private toasts: ToastService,
		private platformService: PlatformService,
	) {
		addIcons({ arrowUndoOutline, eyeOutline, trashOutline, columns: COLUMNS_ICON });
		this.platformService.isLg.pipe(untilDestroyed(this)).subscribe((isLg) => this.isDesktop.set(isLg));

		this.model.setCommitted(this.defaultFilter);
	}

	ngOnInit(): void {
		this.groupsService.currentGroup.pipe(untilDestroyed(this)).subscribe((group) => {
			this.groupId = group?.id;
			this.loadMembers();
		});
		this.model.apply$.pipe(untilDestroyed(this)).subscribe((filter) => this.applyFilter(filter));
	}

	onFilterChange(value: { search?: string }) {
		this.search.set(value.search ?? "");
		this.loadMembers();
	}

	private applyFilter(filter: FilterValues) {
		this.applied.set(filter);
		this.model.setCommitted(filter);
		this.loadMembers();
	}

	setRolesFilter(roles: string[]) {
		this.model.set("roles", roles);
	}

	setMembershipFilter(membership: string[]) {
		this.model.set("membership", membership);
	}

	setShowInactive(showInactive: boolean) {
		this.model.set("showInactive", showInactive);
	}

	onSortChange(sort: AdminTableSort) {
		this.model.patch({ sort: sort.sort || null, order: sort.order });
	}

	private async loadMembers() {
		if (!this.groupId) {
			this.members.set(undefined);
			return;
		}

		this.members.set(undefined);

		const loadId = ++this.latestLoadId;

		const applied = this.applied();
		const sort = (applied["sort"] as string) || undefined;
		const params: SDK.MembersApiListMembersQueryParams = {
			search: this.search() || undefined,
			roles: this.asArray(applied["roles"]) as SDK.ListMembersRolesEnum[],
			membership: this.asArray(applied["membership"]) as SDK.ListMembersMembershipEnum[],
			groups: [this.groupId],
			limit: 1000,
			active: applied["showInactive"] ? undefined : true,
			contacts: this.needsContacts() || undefined,
			sort,
			order: sort ? ((applied["order"] as SDK.ListMembersOrderEnum) ?? "ASC") : undefined,
		};

		const members = await this.api.MembersApi.listMembers(params).then((res) => res.data);

		if (loadId !== this.latestLoadId) return;

		this.members.set(members);
	}

	private asArray(value: unknown): string[] {
		if (Array.isArray(value)) return value.filter(Boolean).map(String);
		if (!value) return [];
		return String(value)
			.split(",")
			.map((s) => s.trim())
			.filter(Boolean);
	}

	private needsContacts(): boolean {
		const selections = this.viewSelections();
		return !!selections["firstTelephone"] || !!selections["firstEmail"];
	}

	private async deleteMember(member: SDK.MemberResponseWithLinks) {
		const confirmation = await this.modalService.deleteConfirmationModal(
			`Opravdu chcete smazat člena ${member.nickname}?`,
		);
		if (!confirmation) return;

		await this.api.MembersApi.deleteMember(member.id);
		this.toasts.toast("Člen smazán.");
		this.loadMembers();
	}

	private async restoreMember(member: SDK.MemberResponseWithLinks) {
		await this.api.MembersApi.restoreMember(member.id);
		this.toasts.toast("Člen obnoven.");
		this.loadMembers();
	}

	originalViewOrder = (a: KeyValue<string, boolean>, b: KeyValue<string, boolean>): number => {
		return 0;
	};

	setViewSelection(key: string, value: boolean) {
		this.viewSelections.update((selections) => ({ ...selections, [key]: value }));

		if (value && (key === "firstTelephone" || key === "firstEmail")) {
			const members = this.members();
			const contactsLoaded = !!members?.some((member) => member.contacts !== undefined);
			if (!contactsLoaded) this.loadMembers();
		}
	}

	public getViewSelectionLabel(key: string): string {
		const labels: { [key: string]: string } = {
			nickname: "Přezdívka",
			name: "Jméno",
			role: "Role",
			age: "Věk",
			membership: "Členství",
			birthday: "Narozeniny",
			addressCity: "Město",
			addressStreet: "Ulice",
			firstTelephone: "Telefon na rodiče",
			firstEmail: "Email na rodiče",
			status: "Stav",
		};

		return labels[key] || key;
	}
}
