import { DatePipe, KeyValue, KeyValuePipe, NgTemplateOutlet } from "@angular/common";
import { AfterViewInit, Component, computed, OnInit, signal } from "@angular/core";
import { FormsModule } from "@angular/forms";
import { ActivatedRoute, Params, Router, RouterLink } from "@angular/router";
import {
	InfiniteScrollCustomEvent,
	IonButton,
	IonCheckbox,
	IonContent,
	IonIcon,
	IonInfiniteScroll,
	IonInfiniteScrollContent,
	IonItem,
	IonItemDivider,
	IonList,
	IonPopover,
	IonToggle,
	ViewWillEnter,
} from "@ionic/angular/standalone";
import { UntilDestroy, untilDestroyed } from "@ngneat/until-destroy";
import { addIcons } from "ionicons";
import { addOutline, arrowUndoOutline, downloadOutline, eyeOutline, trashOutline } from "ionicons/icons";
import { MemberRoles } from "src/app/core/config/member-roles";
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
import { FilterComponent, FilterData } from "src/app/shared/components/filter/filter.component";
import { GroupBadgeComponent } from "src/app/shared/components/group-badge/group-badge.component";
import { PageHeaderComponent } from "src/app/shared/components/page-header/page-header.component";
import { TooltipDirective } from "src/app/shared/directives/tooltip.directive";
import { GroupPipe } from "src/app/shared/pipes/group.pipe";
import { MemberPipe } from "src/app/shared/pipes/member.pipe";
import { SDK } from "src/sdk";
import { MembershipStates } from "../../../../core/config/membership-states";
import { MemberCreateModalComponent } from "../../components/member-create-modal/member-create-modal.component";

// Custom "columns" glyph (outlined rectangle split into three columns) — Ionicons has no columns icon.
// Must be a `data:image/svg+xml;utf8,` URI: ionicons parses that via DOMParser, whereas a raw SVG
// string would be treated as a URL and fetched (failing silently → invisible icon).
const COLUMNS_ICON =
	"data:image/svg+xml;utf8," +
	'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">' +
	'<rect x="64" y="80" width="384" height="352" rx="24" fill="none" stroke="currentColor" stroke-width="32"/>' +
	'<line x1="192" y1="80" x2="192" y2="432" stroke="currentColor" stroke-width="32"/>' +
	'<line x1="320" y1="80" x2="320" y2="432" stroke="currentColor" stroke-width="32"/></svg>';

@UntilDestroy()
@Component({
	selector: "members-list",
	templateUrl: "./members-list.component.html",
	styleUrls: ["./members-list.component.scss"],

	imports: [
		PageHeaderComponent,
		FilterComponent,
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
		RouterLink,
		KeyValuePipe,
		MemberPipe,
		GroupBadgeComponent,
		IonInfiniteScroll,
		IonInfiniteScrollContent,
		DatePipe,
		FilterPillComponent,
		SortSelectComponent,
		NgTemplateOutlet,
		TooltipDirective,
	],
})
export class MembersListComponent implements OnInit, AfterViewInit, ViewWillEnter {
	members = signal<SDK.MemberResponseWithLinks[] | undefined>(undefined);
	groups = signal<SDK.GroupResponseWithLinks[]>([]);
	roles = MemberRoles;
	membershipStates = MembershipStates;
	selectedGroups = signal<string[]>([]);
	selectedRoles = signal<string[]>([]);
	selectedMembership = signal<string[]>([]);

	sortColumn = signal<string | null>(null);
	sortOrder = signal<"ASC" | "DESC">("ASC");

	readonly sortOptions: SortOption[] = [
		{ key: "nickname", label: "Přezdívka" },
		{ key: "name", label: "Jméno" },
		{ key: "group", label: "Oddíl" },
		{ key: "role", label: "Role" },
		{ key: "age", label: "Věk" },
		{ key: "membership", label: "Členství" },
		{ key: "birthday", label: "Datum narození" },
		{ key: "city", label: "Město" },
		{ key: "street", label: "Ulice" },
		{ key: "status", label: "Stav" },
	];

	// Only active groups are offered in the Oddíl filter, unless "show inactive" is on. A group that
	// is already selected stays visible even when inactive, so the pill keeps its label.
	groupOptions = computed<FilterPillOption[]>(() => {
		const showInactive = this.showInactive();
		const selected = this.selectedGroups();
		return this.groups()
			.filter((group) => showInactive || group.active || selected.includes(String(group.id)))
			.map((group) => ({
				value: String(group.id),
				label: group.name ?? group.shortName,
				shortLabel: group.shortName ?? group.name,
				color: this.groupPipe.transform(group.id, "color"),
			}));
	});
	readonly roleOptions: FilterPillOption[] = Object.entries(MemberRoles).map(([key, role]) => ({
		value: key,
		label: role.title,
	}));
	readonly membershipOptions: FilterPillOption[] = Object.entries(MembershipStates).map(([key, state]) => ({
		value: key,
		label: state.title,
	}));

	// Row helpers for admin-table (bound as inputs, so keep stable references).
	rowLink = (member: SDK.MemberResponseWithLinks) => "" + member.id;
	rowClass = (member: SDK.MemberResponseWithLinks) => ({
		"member-inactive": !member.active,
		"member-paused": member.membership === "pozastaveno",
		"member-vedouci": member.role === "vedouci",
		"member-instruktor": member.role === "instruktor",
	});

	// Header shown above the actions on the mobile ActionSheet.
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

	actions = signal<Action[]>([
		{
			text: "Nový člen",
			icon: "add-outline",
			pinned: true,
			handler: () => this.create(),
		},
		{
			text: "Export do XLSX",
			icon: "download-outline",
			pinned: false,
			handler: () => this.export(),
		},
		{
			text: "Smazaní členové",
			icon: "trash-outline",
			pinned: false,
			handler: () => this.router.navigate(["smazane"], { relativeTo: this.route }),
		},
	]);

	filter: FilterData = {};

	page = 1;
	pageSize = 50;

	private latestLoadId = 0;

	viewSelections = signal<{ [key: string]: boolean }>({});

	constructor(
		private api: ApiService,
		private route: ActivatedRoute,
		private router: Router,
		private toasts: ToastService,
		private modalService: ModalService,
		private groupPipe: GroupPipe,
		private platformService: PlatformService,
	) {
		addIcons({ addOutline, arrowUndoOutline, downloadOutline, eyeOutline, trashOutline, columns: COLUMNS_ICON });
		// Filters render inline in the toolbar on desktop and inside the filter modal on mobile;
		// this tracks the lg breakpoint (992px) so the template can switch between the two.
		this.platformService.isLg.pipe(untilDestroyed(this)).subscribe((isLg) => this.isDesktop.set(isLg));
	}

	// True when the viewport is at least the lg breakpoint (992px) — filters inline vs. in the modal.
	isDesktop = signal(true);

	// True when inactive members (and groups) are currently shown (filter "active" === "all").
	showInactive = signal(false);

	ngOnInit() {
		// All filter state (groups/roles/membership/age/search/active) is written to the URL via
		// setFilterParam, so drive loading from the query params directly rather than the
		// FilterComponent's `(change)` output (which only reflects its own projected NgModel
		// controls — the pills are now plain buttons and no longer register there).
		this.route.queryParams.pipe(untilDestroyed(this)).subscribe((params) => this.onFilterChange(params));
	}

	ngAfterViewInit(): void {
		this.loadViewSelections();
	}

	ionViewWillEnter() {
		this.loadGroups();
	}

	export() {
		// FIXME: do not use as any
		const params: SDK.MembersApiExportMembersXlsxQueryParams = {
			search: this.filter.search || undefined,
			roles: this.normalizeFilterValueToArray((this.filter as any)["roles"]) as SDK.ExportMembersXlsxRolesEnum[],
			membership: this.normalizeFilterValueToArray(
				(this.filter as any)["membership"],
			) as SDK.ExportMembersXlsxMembershipEnum[],
			groups: this.normalizeFilterValueToArray((this.filter as any)["groups"]).map((group) =>
				parseInt(group, 10),
			),
			active: (((this.filter as any)["active"] as string) || "active") === "all" ? undefined : true,
		};

		this.api.MembersApi.exportMembersXlsx(params, { responseType: "blob" }).then((res) => {
			const blob = new Blob([res.data], {
				type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
			});

			const url = URL.createObjectURL(blob);
			const a = document.createElement("a");
			a.href = url;
			a.download = "clenove.xlsx";
			a.click();
			URL.revokeObjectURL(url);
		});
	}

	copyRow(cells: string[]) {
		const data = cells.join("\t");

		navigator.clipboard.writeText(data);

		this.toasts.toast("Zkopírováno do schránky.");
	}

	onFilterChange(params: Params) {
		this.filter = { ...params };
		this.selectedGroups.set(this.normalizeFilterValueToArray(params["groups"]));
		this.selectedRoles.set(this.normalizeFilterValueToArray(params["roles"]));
		this.selectedMembership.set(this.normalizeFilterValueToArray(params["membership"]));
		this.showInactive.set(((params["active"] as string) || "active") === "all");
		this.sortColumn.set(params["sort"] ?? null);
		this.sortOrder.set(params["order"] === "DESC" ? "DESC" : "ASC");
		this.loadMembers(this.filter);
	}

	onSortChange(sort: AdminTableSort) {
		this.router.navigate([], {
			queryParams: { sort: sort.sort || null, order: sort.sort ? sort.order : null },
			queryParamsHandling: "merge",
			replaceUrl: true,
		});
	}

	setFilterParam(name: string, value: string | string[] | null) {
		let formattedValue = value;

		if (Array.isArray(value)) {
			formattedValue = value.length > 0 ? value.join(",") : null;
		}

		this.router.navigate([], {
			queryParams: { [name]: formattedValue || null },
			queryParamsHandling: "merge",
			replaceUrl: true,
		});
	}

	async onInfiniteScroll(e: InfiniteScrollCustomEvent) {
		await this.loadMembers(this.filter, true);
		e.target.complete();
	}

	private async loadMembers(filter: FilterData, loadMore: boolean = false) {
		if (loadMore) {
			const memberList = this.members();
			if (!memberList || memberList.length < this.page * this.pageSize) return;
			this.page++;
		} else {
			this.page = 1;
			this.members.set([]);
		}

		// Each load gets a unique id so out-of-order responses from rapid filter
		// changes (e.g. unchecking one role then checking another) can be discarded
		// and only the latest request is allowed to update the list.
		const loadId = ++this.latestLoadId;

		const params: SDK.MembersApiListMembersQueryParams = {
			search: filter.search || undefined,
			offset: (this.page - 1) * this.pageSize,
			roles: this.normalizeFilterValueToArray(filter["roles"]) as SDK.ListMembersRolesEnum[],
			membership: this.normalizeFilterValueToArray(filter["membership"]) as SDK.ListMembersMembershipEnum[],
			limit: this.pageSize,
			groups: this.normalizeFilterValueToArray(filter["groups"]).map((group) => parseInt(group, 10)),
			// default: active only; "all" reveals inactive members too
			active: ((filter["active"] as string) || "active") === "all" ? undefined : true,
			// Fetch contacts in the same request instead of one call per member,
			// and only when a contact column is actually visible.
			contacts: this.needsContacts() || undefined,
			sort: (filter["sort"] as string) || undefined,
			order: (filter["order"] as SDK.ListMembersOrderEnum) || undefined,
		};

		const members = await this.api.MembersApi.listMembers(params).then((res) => res.data);

		if (loadId !== this.latestLoadId) return;

		const currentMembers = this.members() || [];
		this.members.set([...currentMembers, ...members]);
	}

	// Contacts are only needed when the phone/email columns are shown.
	private needsContacts(): boolean {
		const selections = this.viewSelections();
		return !!selections["firstTelephone"] || !!selections["firstEmail"];
	}

	private normalizeFilterValueToArray(value: string | string[] | null | undefined): string[] {
		if (Array.isArray(value)) return value.filter((item) => !!item).map((item) => String(item));
		if (!value) return [];

		return String(value)
			.split(",")
			.map((item) => item.trim())
			.filter((item) => !!item);
	}

	private async loadGroups() {
		const groups = await this.api.MembersApi.listGroups().then((res) => res.data);
		groups.sort((a, b) =>
			(a.name ?? a.shortName).localeCompare(b.name ?? b.shortName, undefined, { numeric: true }),
		);
		this.groups.set(groups);
	}

	private async deleteMember(member: SDK.MemberResponseWithLinks) {
		const confirmation = await this.modalService.deleteConfirmationModal(
			`Opravdu chcete smazat člena ${member.nickname}?`,
		);
		if (!confirmation) return;

		await this.api.MembersApi.deleteMember(member.id);
		this.toasts.toast("Člen smazán.");
		this.loadMembers(this.filter);
	}

	private async restoreMember(member: SDK.MemberResponseWithLinks) {
		await this.api.MembersApi.restoreMember(member.id);
		this.toasts.toast("Člen obnoven.");
		this.loadMembers(this.filter);
	}

	async create() {
		const memberData = await this.modalService.componentModal(MemberCreateModalComponent);
		if (!memberData) return;

		const member = await this.api.MembersApi.createMember(memberData).then((res) => res.data);
		this.toasts.toast("Člen uložen.");

		this.router.navigate([member.id], { relativeTo: this.route });
	}

	originalViewOrder = (a: KeyValue<string, boolean>, b: KeyValue<string, boolean>): number => {
		return 0;
	};

	private loadViewSelections() {
		this.viewSelections.set({
			nickname: true,
			name: true,
			group: true,
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
	}

	setViewSelection(key: string, value: boolean) {
		this.applyViewSelections({ ...this.viewSelections(), [key]: value });
	}

	// Mobile renders the column picker as a multiselect pill, which emits the full list of
	// visible columns rather than a single toggle.
	setColumnSelection(keys: string[]) {
		const selected = new Set(keys);
		this.applyViewSelections(
			Object.fromEntries(Object.keys(this.viewSelections()).map((key) => [key, selected.has(key)])),
		);
	}

	private applyViewSelections(selections: { [key: string]: boolean }) {
		const previous = this.viewSelections();
		this.viewSelections.set(selections);

		// Enabling a contact column after the list was already loaded without contacts:
		// re-fetch so the newly visible column has data (still a single request).
		const contactColumnAdded = ["firstTelephone", "firstEmail"].some((key) => selections[key] && !previous[key]);
		if (contactColumnAdded) {
			const members = this.members();
			const contactsLoaded = !!members?.some((member) => member.contacts !== undefined);
			if (!contactsLoaded) this.loadMembers(this.filter);
		}
	}

	columnOptions = computed<FilterPillOption[]>(() =>
		Object.keys(this.viewSelections()).map((key) => ({ value: key, label: this.getViewSelectionLabel(key) })),
	);

	selectedColumns = computed(() =>
		Object.entries(this.viewSelections())
			.filter(([, visible]) => visible)
			.map(([key]) => key),
	);

	public getViewSelectionLabel(key: string): string {
		const labels: { [key: string]: string } = {
			nickname: "Přezdívka",
			name: "Jméno",
			group: "Oddíl",
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
