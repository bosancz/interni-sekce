import { DatePipe, KeyValue, KeyValuePipe, NgTemplateOutlet } from "@angular/common";
import { AfterViewInit, Component, computed, inject, OnInit, signal } from "@angular/core";
import { ActivatedRoute, Params, Router } from "@angular/router";
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
import { eyeOutline } from "ionicons/icons";
import { MemberRoles } from "src/app/core/config/member-roles";
import { MembershipPaymentStates } from "src/app/core/config/membership";
import { currentMembershipYear, isMembershipPaid, setMembershipPaid } from "src/app/core/helpers/membership";
import { getVariableSymbol } from "src/app/core/helpers/variable-symbol";
import { ApiService } from "src/app/core/services/api.service";
import { PlatformService } from "src/app/core/services/platform.service";
import { ToastService } from "src/app/core/services/toast.service";
import { AdminTableCellDirective } from "src/app/shared/components/admin-table/admin-table-cell.directive";
import { AdminTableColumnComponent } from "src/app/shared/components/admin-table/admin-table-column.component";
import { AdminTableComponent, AdminTableSort } from "src/app/shared/components/admin-table/admin-table.component";
import { FilterModel, FilterValues } from "src/app/shared/components/filter/filter-model";
import { FilterComponent, FilterData } from "src/app/shared/components/filter/filter.component";
import { FilterPillComponent, FilterPillOption } from "src/app/shared/components/filter-pill/filter-pill.component";
import { GroupBadgeComponent } from "src/app/shared/components/group-badge/group-badge.component";
import { PageHeaderComponent } from "src/app/shared/components/page-header/page-header.component";
import { SortOption, SortSelectComponent } from "src/app/shared/components/sort-select/sort-select.component";
import { TooltipDirective } from "src/app/shared/directives/tooltip.directive";
import { GroupPipe } from "src/app/shared/pipes/group.pipe";
import { MemberPipe } from "src/app/shared/pipes/member.pipe";
import { SDK } from "src/sdk";

// Custom "columns" glyph, same as the members list — see the note there on why it must be a
// `data:image/svg+xml;utf8,` URI rather than a raw SVG string.
const COLUMNS_ICON =
	"data:image/svg+xml;utf8," +
	'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">' +
	'<rect x="64" y="80" width="384" height="352" rx="24" fill="none" stroke="currentColor" stroke-width="32"/>' +
	'<line x1="192" y1="80" x2="192" y2="432" stroke="currentColor" stroke-width="32"/>' +
	'<line x1="320" y1="80" x2="320" y2="432" stroke="currentColor" stroke-width="32"/></svg>';

/** How far back and forward the year picker reaches around the current season. */
const YEARS_BACK = 10;
const YEARS_AHEAD = 1;

/**
 * Treasurer view: the member list seen through one year's membership fee.
 *
 * It deliberately mirrors the members list (same filters, sort keys, column picker, infinite
 * scroll, table on desktop / list on mobile) and adds the two things the treasurer needs: a year
 * to look at, and a fee column that is edited straight in the table.
 *
 * Everyone who may list members may open the page; only an admin may change a fee, which the API
 * decides — the toggle follows each row's `updateMemberMembership` link rather than a role check
 * of its own.
 */
@UntilDestroy()
@Component({
	selector: "bo-treasurer-list",
	templateUrl: "./treasurer-list.component.html",
	styleUrls: ["./treasurer-list.component.scss"],

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
		IonInfiniteScroll,
		IonInfiniteScrollContent,
		AdminTableComponent,
		AdminTableColumnComponent,
		AdminTableCellDirective,
		FilterPillComponent,
		SortSelectComponent,
		GroupBadgeComponent,
		KeyValuePipe,
		DatePipe,
		MemberPipe,
		NgTemplateOutlet,
		TooltipDirective,
	],
	providers: [FilterModel],
})
export class TreasurerListComponent implements OnInit, AfterViewInit, ViewWillEnter {
	private model = inject(FilterModel);

	members = signal<SDK.MemberResponseWithLinks[] | undefined>(undefined);
	groups = signal<SDK.GroupResponseWithLinks[]>([]);

	/** Members whose fee is being saved right now — their toggle is disabled meanwhile. */
	private saving = signal<ReadonlySet<number>>(new Set());

	// Display state derives from the model: staged draft while the mobile modal is open, else the
	// committed filter (which lives in the URL, so a view can be linked to and survives a reload).
	selectedGroups = computed(() => this.normalizeFilterValueToArray(this.model.value("groups")));
	selectedRoles = computed(() => this.normalizeFilterValueToArray(this.model.value("roles")));
	selectedMembership = computed(() => this.normalizeFilterValueToArray(this.model.value("membership")));

	/** The year the whole page is about: the fee column, the fee filter and the fee sort. */
	year = computed(() => {
		const value = Number(this.model.value("year"));
		return this.years.includes(value) ? value : currentMembershipYear();
	});
	selectedYear = computed(() => [String(this.year())]);

	sortColumn = computed<string | null>(() => (this.model.value("sort") as string) ?? null);
	sortOrder = computed<"ASC" | "DESC">(() => (this.model.value("order") === "DESC" ? "DESC" : "ASC"));

	readonly sortOptions: SortOption[] = [
		{ key: "membership", label: "Příspěvek" },
		{ key: "variableSymbol", label: "VS" },
		{ key: "nickname", label: "Přezdívka" },
		{ key: "name", label: "Jméno" },
		{ key: "group", label: "Oddíl" },
		{ key: "role", label: "Role" },
		{ key: "age", label: "Věk" },
		{ key: "birthday", label: "Datum narození" },
		{ key: "city", label: "Město" },
		{ key: "street", label: "Ulice" },
		{ key: "status", label: "Stav" },
	];

	// Newest first: the current season is what the treasurer needs most of the time, the years
	// before it are the history.
	private readonly years = Array.from(
		{ length: YEARS_BACK + YEARS_AHEAD + 1 },
		(_, index) => currentMembershipYear() + YEARS_AHEAD - index,
	);
	readonly yearOptions: FilterPillOption[] = this.years.map((year) => ({
		value: String(year),
		label: String(year),
	}));

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
	readonly membershipOptions: FilterPillOption[] = Object.entries(MembershipPaymentStates).map(([key, state]) => ({
		value: key,
		label: state.title,
	}));

	// Row helpers for admin-table (bound as inputs, so keep stable references).
	rowLink = (member: SDK.MemberResponseWithLinks) => ["/databaze/clenove", member.id];
	rowClass = (member: SDK.MemberResponseWithLinks) => ({
		"member-inactive": !member.active,
		"member-vedouci": member.role === "vedouci",
		"member-instruktor": member.role === "instruktor",
	});

	filter: FilterData = {};

	page = 1;
	pageSize = 50;

	private latestLoadId = 0;

	viewSelections = signal<{ [key: string]: boolean }>({});

	// True when the viewport is at least the lg breakpoint (992px) — filters inline vs. in the modal.
	isDesktop = signal(true);

	// True when inactive members (and groups) are currently shown (filter "active" === "all").
	showInactive = computed(() => ((this.model.value("active") as string) || "active") === "all");

	constructor(
		private api: ApiService,
		private route: ActivatedRoute,
		private router: Router,
		private toasts: ToastService,
		private groupPipe: GroupPipe,
		private platformService: PlatformService,
	) {
		addIcons({ eyeOutline, columns: COLUMNS_ICON });
		this.platformService.isLg.pipe(untilDestroyed(this)).subscribe((isLg) => this.isDesktop.set(isLg));
	}

	ngOnInit() {
		this.route.queryParams.pipe(untilDestroyed(this)).subscribe((params) => this.onParams(params));
		this.model.apply$.pipe(untilDestroyed(this)).subscribe((filter) => this.applyFilter(filter));
	}

	ngAfterViewInit(): void {
		this.loadViewSelections();
	}

	ionViewWillEnter() {
		this.loadGroups();
	}

	/** The variable symbol the member pays the selected year's fee under. */
	variableSymbol(member: SDK.MemberResponse): string {
		return getVariableSymbol(member, this.year());
	}

	/** Is this member's fee for the year on screen paid? */
	isPaid(member: SDK.MemberResponse): boolean {
		return isMembershipPaid(member.membership, this.year());
	}

	membershipLabel(member: SDK.MemberResponse): string {
		return this.isPaid(member)
			? MembershipPaymentStates.zaplaceno.title
			: MembershipPaymentStates.nezaplaceno.title;
	}

	/** Only an admin may record a fee — the API says so per member, through the row's links. */
	canEditMembership(member: SDK.MemberResponseWithLinks): boolean {
		return !!member._links?.updateMemberMembership?.allowed;
	}

	isSaving(member: SDK.MemberResponse): boolean {
		return this.saving().has(member.id);
	}

	/**
	 * Flip the fee of the year on screen. The row is a link to the member, so the click must not
	 * bubble up to it. The table is updated straight away and rolled back if the request fails.
	 */
	async toggleMembership(member: SDK.MemberResponseWithLinks, event: Event) {
		event.stopPropagation();
		event.preventDefault();

		if (!this.canEditMembership(member) || this.isSaving(member)) return;

		const year = this.year();
		const paid = !this.isPaid(member);
		const previous = member.membership;

		this.setMemberMembership(member.id, setMembershipPaid(previous, paid, year));
		this.saving.update((ids) => new Set(ids).add(member.id));

		try {
			await this.api.MembersApi.updateMemberMembership(member.id, { year, paid });
		} catch {
			this.setMemberMembership(member.id, previous);
			this.toasts.toast("Příspěvek se nepodařilo uložit.");
		} finally {
			this.saving.update((ids) => {
				const next = new Set(ids);
				next.delete(member.id);
				return next;
			});
		}
	}

	private setMemberMembership(memberId: number, membership: number[]) {
		this.members.update((members) =>
			members?.map((member) => (member.id === memberId ? { ...member, membership } : member)),
		);
	}

	onSortChange(sort: AdminTableSort) {
		this.model.patch({ sort: sort.sort || null, order: sort.sort ? sort.order : null });
	}

	setFilterParam(name: string, value: string | string[] | null) {
		this.model.set(name, value);
	}

	onParams(params: Params) {
		this.model.setCommitted(this.modelFromParams(params));
		this.filter = { ...params };
		this.loadMembers(this.filter);
	}

	private modelFromParams(p: Params): FilterValues {
		return {
			groups: this.normalizeFilterValueToArray(p["groups"]),
			roles: this.normalizeFilterValueToArray(p["roles"]),
			membership: this.normalizeFilterValueToArray(p["membership"]),
			year: p["year"] ?? null,
			active: p["active"] ?? null,
			sort: p["sort"] ?? null,
			order: p["order"] ?? null,
		};
	}

	private applyFilter(filter: FilterValues) {
		const list = (value: unknown) => {
			const array = this.normalizeFilterValueToArray(value);
			return array.length ? array.join(",") : null;
		};
		this.router.navigate([], {
			queryParams: {
				groups: list(filter["groups"]),
				roles: list(filter["roles"]),
				membership: list(filter["membership"]),
				year: list(filter["year"]),
				active: (filter["active"] as string) || null,
				sort: (filter["sort"] as string) || null,
				order: (filter["order"] as string) || null,
			},
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
			this.members.set(undefined);
		}

		// Each load gets a unique id so out-of-order responses from rapid filter changes can be
		// discarded and only the latest request updates the list.
		const loadId = ++this.latestLoadId;

		const params: SDK.MembersApiListMembersQueryParams = {
			search: filter.search || undefined,
			offset: (this.page - 1) * this.pageSize,
			limit: this.pageSize,
			roles: this.normalizeFilterValueToArray(filter["roles"]) as SDK.ListMembersRolesEnum[],
			membership: this.normalizeFilterValueToArray(filter["membership"]) as SDK.MembershipPaymentStatesEnum[],
			// The fee filter and the fee sort are asked about the year on screen, not about today.
			membershipYear: this.year(),
			groups: this.normalizeFilterValueToArray(filter["groups"]).map((group) => parseInt(group, 10)),
			// default: active only; "all" reveals inactive members too
			active: ((filter["active"] as string) || "active") === "all" ? undefined : true,
			contacts: this.needsContacts() || undefined,
			sort: (filter["sort"] as string) || undefined,
			order: (filter["order"] as SDK.ListMembersOrderEnum) || undefined,
		};

		const members = await this.api.MembersApi.listMembers(params).then((res) => res.data);

		if (loadId !== this.latestLoadId) return;

		this.members.set([...(loadMore ? (this.members() ?? []) : []), ...members]);
	}

	// Contacts are only needed when the phone/email columns are shown.
	private needsContacts(): boolean {
		const selections = this.viewSelections();
		return !!selections["firstTelephone"] || !!selections["firstEmail"];
	}

	private normalizeFilterValueToArray(value: unknown): string[] {
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

	originalViewOrder = (a: KeyValue<string, boolean>, b: KeyValue<string, boolean>): number => {
		return 0;
	};

	// The fee column is the point of the page, so it is always on and is not offered here.
	private loadViewSelections() {
		this.viewSelections.set({
			variableSymbol: true,
			nickname: true,
			name: true,
			group: true,
			role: false,
			age: false,
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
			variableSymbol: "VS",
			nickname: "Přezdívka",
			name: "Jméno",
			group: "Oddíl",
			role: "Role",
			age: "Věk",
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
