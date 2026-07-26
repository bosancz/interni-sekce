import { DatePipe, KeyValue, KeyValuePipe, NgTemplateOutlet } from "@angular/common";
import { Component, computed, OnInit, signal } from "@angular/core";
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

// Custom "columns" glyph (outlined rectangle split into three columns) — Ionicons has no columns icon.
// Must be a `data:image/svg+xml;utf8,` URI: ionicons parses that via DOMParser, whereas a raw SVG
// string would be treated as a URL and fetched (failing silently → invisible icon).
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
import { TooltipDirective } from "src/app/shared/directives/tooltip.directive";
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
		TooltipDirective,
	],
})
export class GroupMembersComponent implements OnInit {
	members = signal<SDK.MemberResponseWithLinks[] | undefined>(undefined);

	roles = MemberRoles;
	membershipStates = MembershipStates;

	selectedRoles = signal<string[]>([]);
	selectedMembership = signal<string[]>([]);

	sortColumn = signal<string | null>("role");
	sortOrder = signal<"ASC" | "DESC">("DESC");

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
	showInactive = signal(false);
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

	// True when the viewport is at least the lg breakpoint (992px) — filters inline vs. in the modal.
	isDesktop = signal(true);

	// Row helpers for admin-table (bound as inputs, so keep stable references).
	rowLink = (member: SDK.MemberResponseWithLinks) => ["/databaze/clenove", member.id];
	rowClass = (member: SDK.MemberResponseWithLinks) => ({
		"member-inactive": !member.active,
		"member-paused": member.membership === "pozastaveno",
		"member-vedouci": member.role === "vedouci",
		"member-instruktor": member.role === "instruktor",
	});
	rowActionsHeader = (member: SDK.MemberResponseWithLinks) => member.nickname || member.firstName;

	// Arrow property (stable reference + bound `this`) so it can be passed as the
	// admin-table `[actions]` input and invoked from there per row.
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
		// Filters render inline in the toolbar on desktop and inside the filter modal on mobile;
		// this tracks the lg breakpoint (992px) so the template can switch between the two.
		this.platformService.isLg.pipe(untilDestroyed(this)).subscribe((isLg) => this.isDesktop.set(isLg));
	}

	ngOnInit(): void {
		this.groupsService.currentGroup.pipe(untilDestroyed(this)).subscribe((group) => {
			this.groupId = group?.id;
			this.loadMembers();
		});
	}

	onFilterChange(value: { search?: string }) {
		this.search.set(value.search ?? "");
		this.loadMembers();
	}

	setRolesFilter(roles: string[]) {
		this.selectedRoles.set(roles);
		this.loadMembers();
	}

	setMembershipFilter(membership: string[]) {
		this.selectedMembership.set(membership);
		this.loadMembers();
	}

	setShowInactive(showInactive: boolean) {
		this.showInactive.set(showInactive);
		this.loadMembers();
	}

	onSortChange(sort: AdminTableSort) {
		this.sortColumn.set(sort.sort || null);
		this.sortOrder.set(sort.order);
		this.loadMembers();
	}

	private async loadMembers() {
		if (!this.groupId) {
			this.members.set(undefined);
			return;
		}

		this.members.set(undefined);

		// Each load gets a unique id so out-of-order responses from rapid filter
		// changes can be discarded and only the latest request updates the list.
		const loadId = ++this.latestLoadId;

		const params: SDK.MembersApiListMembersQueryParams = {
			search: this.search() || undefined,
			roles: this.selectedRoles() as SDK.ListMembersRolesEnum[],
			membership: this.selectedMembership() as SDK.ListMembersMembershipEnum[],
			groups: [this.groupId],
			// No pagination UI here — load the whole group in one request.
			limit: 1000,
			// default: active only; "show inactive" reveals inactive members too
			active: this.showInactive() ? undefined : true,
			// Fetch contacts in the same request instead of one call per member,
			// and only when a contact column is actually visible.
			contacts: this.needsContacts() || undefined,
			sort: this.sortColumn() || undefined,
			order: this.sortColumn() ? this.sortOrder() : undefined,
		};

		const members = await this.api.MembersApi.listMembers(params).then((res) => res.data);

		if (loadId !== this.latestLoadId) return;

		this.members.set(members);
	}

	// Contacts are only needed when the phone/email columns are shown.
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

		// Enabling a contact column after the list was already loaded without contacts:
		// re-fetch so the newly visible column has data (still a single request).
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
			firstTelephone: "První telefon",
			firstEmail: "První email",
			status: "Stav",
		};

		return labels[key] || key;
	}
}
