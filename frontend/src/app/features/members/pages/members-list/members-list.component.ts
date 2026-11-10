import { MEMBER_ACHIEVEMENT_FILTER_OPTIONS } from "src/app/core/config/member-achievements";
import { Component, computed, effect, inject, OnInit, signal, untracked } from "@angular/core";
import { ActivatedRoute, Params, Router } from "@angular/router";
import {
	InfiniteScrollCustomEvent,
	IonContent,
	IonInfiniteScroll,
	IonInfiniteScrollContent,
	ViewWillEnter,
	ViewWillLeave,
} from "@ionic/angular/standalone";
import { UntilDestroy, untilDestroyed } from "@ngneat/until-destroy";
import { addIcons } from "ionicons";
import { addOutline, downloadOutline, schoolOutline, trashOutline } from "ionicons/icons";
import { MemberRoles } from "src/app/core/config/member-roles";
import { ApiService } from "src/app/core/services/api.service";
import { ModalService } from "src/app/core/services/modal.service";
import { PlatformService } from "src/app/core/services/platform.service";
import { ToastService } from "src/app/core/services/toast.service";
import { Action } from "src/app/shared/components/action-buttons/action-buttons.component";
import { AdminTableSort } from "src/app/shared/components/admin-table/admin-table.component";
import { FilterData } from "src/app/shared/components/filter/filter.component";
import { PeopleColumns } from "src/app/shared/components/people-table/people-columns";
import {
	PeopleFilterComponent,
	PeopleFilterPillsDirective,
} from "src/app/shared/components/people-table/people-filter.component";
import { PeopleTableComponent } from "src/app/shared/components/people-table/people-table.component";
import { FilterPillComponent, FilterPillOption } from "src/app/shared/components/filter-pill/filter-pill.component";
import { SortOption } from "src/app/shared/components/sort-select/sort-select.component";
import { FilterModel, FilterValues } from "src/app/shared/components/filter/filter-model";
import { PageHeaderComponent } from "src/app/shared/components/page-header/page-header.component";
import { GroupPipe } from "src/app/shared/pipes/group.pipe";
import { SDK } from "src/sdk";
import { MembershipPaymentStates } from "../../../../core/config/membership";
import { MemberCreateModalComponent } from "../../components/member-create-modal/member-create-modal.component";
import { getPagesToLoad, getParamsKey, ListLoadMode } from "src/helpers/list-loading";

@UntilDestroy()
@Component({
	selector: "members-list",
	templateUrl: "./members-list.component.html",
	styleUrls: ["./members-list.component.scss"],

	imports: [
		PageHeaderComponent,
		PeopleFilterComponent,
		PeopleFilterPillsDirective,
		PeopleTableComponent,
		FilterPillComponent,
		IonContent,
		IonInfiniteScroll,
		IonInfiniteScrollContent,
	],
	providers: [FilterModel],
})
export class MembersListComponent implements OnInit, ViewWillEnter, ViewWillLeave {
	private model = inject(FilterModel);

	readonly columns = new PeopleColumns({ settingsKey: "membersListColumns" });

	members = signal<SDK.MemberResponseWithLinks[] | undefined>(undefined);
	groups = signal<SDK.GroupResponseWithLinks[]>([]);
	roles = MemberRoles;

	selectedGroups = computed(() => this.normalizeFilterValueToArray(this.model.value("groups")));
	selectedRoles = computed(() => this.normalizeFilterValueToArray(this.model.value("roles")));
	selectedMembership = computed(() => this.normalizeFilterValueToArray(this.model.value("membership")));
	selectedAchievements = computed(() => this.normalizeFilterValueToArray(this.model.value("achievements")));

	sortColumn = computed<string | null>(() => (this.model.value("sort") as string) ?? null);
	sortOrder = computed<"ASC" | "DESC">(() => (this.model.value("order") === "DESC" ? "DESC" : "ASC"));

	readonly sortOptions: SortOption[] = [
		{ key: "nickname", label: "Přezdívka" },
		{ key: "firstName", label: "Jméno" },
		{ key: "lastName", label: "Příjmení" },
		{ key: "group", label: "Oddíl" },
		{ key: "role", label: "Role" },
		{ key: "age", label: "Věk" },
		{ key: "membership", label: "Členství" },
		{ key: "birthday", label: "Datum narození" },
		{ key: "city", label: "Město" },
		{ key: "street", label: "Ulice" },
		{ key: "status", label: "Stav" },
	];

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

	readonly achievementOptions: FilterPillOption[] = MEMBER_ACHIEVEMENT_FILTER_OPTIONS;

	rowLink = (member: SDK.MemberResponseWithLinks) => "" + member.id;
	rowClass = (member: SDK.MemberResponseWithLinks) => ({
		"member-inactive": !member.active,
		"member-vedouci": member.role === "vedouci",
		"member-instruktor": member.role === "instruktor",
	});

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
			text: "Hromadné školení",
			icon: "school-outline",
			pinned: false,
			handler: () => this.router.navigate(["/databaze/skoleni"]),
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

	constructor(
		private api: ApiService,
		private route: ActivatedRoute,
		private router: Router,
		private toasts: ToastService,
		private modalService: ModalService,
		private groupPipe: GroupPipe,
		private platformService: PlatformService,
	) {
		addIcons({
			addOutline,
			downloadOutline,
			schoolOutline,
			trashOutline,
		});
		this.platformService.isLg.pipe(untilDestroyed(this)).subscribe((isLg) => this.isDesktop.set(isLg));

		effect(() => {
			const needsContacts = this.columns.needsContacts();
			const needsBadges = this.columns.needsBadges();
			untracked(() => this.reloadForColumns(needsContacts, needsBadges));
		});
	}

	isDesktop = signal(true);

	showInactive = computed(() => ((this.model.value("active") as string) || "active") === "all");

	ngOnInit() {
		this.route.queryParams.pipe(untilDestroyed(this)).subscribe((params) => this.onParams(params));
		this.model.apply$.pipe(untilDestroyed(this)).subscribe((filter) => this.applyFilter(filter));
	}

	ionViewWillEnter() {
		this.loadGroups();
		if (this.hasLeft) this.loadMembers(this.filter, "refresh");
	}

	ionViewWillLeave() {
		this.hasLeft = true;
	}

	export() {
		// FIXME: do not use as any
		const params: SDK.MembersApiExportMembersXlsxQueryParams = {
			search: this.filter.search || undefined,
			roles: this.normalizeFilterValueToArray((this.filter as any)["roles"]) as SDK.ExportMembersXlsxRolesEnum[],
			membership: this.normalizeFilterValueToArray(
				(this.filter as any)["membership"],
			) as SDK.MembershipPaymentStatesEnum[],
			achievements: this.normalizeFilterValueToArray(
				(this.filter as any)["achievements"],
			) as SDK.MemberAchievementTypesEnum[],
			groups: this.normalizeFilterValueToArray((this.filter as any)["groups"]).map((group) =>
				parseInt(group, 10),
			),
			active: (((this.filter as any)["active"] as string) || "active") === "all" ? undefined : true,
			sort: ((this.filter as any)["sort"] as string) || undefined,
			order: ((this.filter as any)["order"] as SDK.ExportMembersXlsxOrderEnum) || undefined,
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

	private loadedFilterKey: string | null = null;

	private hasLeft = false;

	onParams(params: Params) {
		this.model.setCommitted(this.modelFromParams(params));

		const filterKey = getParamsKey(params);
		if (filterKey === this.loadedFilterKey) return;
		this.loadedFilterKey = filterKey;

		this.filter = { ...params };
		this.loadMembers(this.filter);
	}

	private modelFromParams(p: Params): FilterValues {
		return {
			groups: this.normalizeFilterValueToArray(p["groups"]),
			roles: this.normalizeFilterValueToArray(p["roles"]),
			membership: this.normalizeFilterValueToArray(p["membership"]),
			achievements: this.normalizeFilterValueToArray(p["achievements"]),
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
				achievements: list(filter["achievements"]),
				active: (filter["active"] as string) || null,
				sort: (filter["sort"] as string) || null,
				order: (filter["order"] as string) || null,
			},
			queryParamsHandling: "merge",
			replaceUrl: true,
		});
	}

	onSortChange(sort: AdminTableSort) {
		this.model.patch({ sort: sort.sort || null, order: sort.sort ? sort.order : null });
	}

	setFilterParam(name: string, value: string | string[] | null) {
		this.model.set(name, value);
	}

	async onInfiniteScroll(e: InfiniteScrollCustomEvent) {
		await this.loadMembers(this.filter, "more");
		e.target.complete();
	}

	private async loadMembers(filter: FilterData, mode: ListLoadMode = "reset") {
		if (mode === "more") {
			const memberList = this.members();
			if (!memberList || memberList.length < this.page * this.pageSize) return;
			this.page++;
		} else if (mode === "reset") {
			this.page = 1;
			this.members.set([]);
		}

		const loadId = ++this.latestLoadId;

		const params: SDK.MembersApiListMembersQueryParams = {
			search: filter.search || undefined,
			roles: this.normalizeFilterValueToArray(filter["roles"]) as SDK.ListMembersRolesEnum[],
			membership: this.normalizeFilterValueToArray(filter["membership"]) as SDK.MembershipPaymentStatesEnum[],
			achievements: this.normalizeFilterValueToArray(filter["achievements"]) as SDK.MemberAchievementTypesEnum[],
			limit: this.pageSize,
			groups: this.normalizeFilterValueToArray(filter["groups"]).map((group) => parseInt(group, 10)),
			active: ((filter["active"] as string) || "active") === "all" ? undefined : true,
			contacts: this.columns.needsContacts() || undefined,
			badges: this.columns.needsBadges() || undefined,
			sort: (filter["sort"] as string) || undefined,
			order: (filter["order"] as SDK.ListMembersOrderEnum) || undefined,
		};

		const pages = await Promise.all(
			getPagesToLoad(mode, this.page).map((page) =>
				this.api.MembersApi.listMembers({ ...params, offset: (page - 1) * this.pageSize }).then(
					(res) => res.data,
				),
			),
		).catch((err) => {
			if (mode === "refresh") return null;
			throw err;
		});

		if (loadId !== this.latestLoadId || !pages) return;

		const members = pages.flat();
		this.members.set(mode === "more" ? [...(this.members() ?? []), ...members] : members);
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

	async create() {
		const memberData = await this.modalService.componentModal(MemberCreateModalComponent);
		if (!memberData) return;

		const member = await this.api.MembersApi.createMember(memberData).then((res) => res.data);
		this.toasts.toast("Člen uložen.");

		this.router.navigate([member.id], { relativeTo: this.route });
	}

	private reloadForColumns(needsContacts: boolean, needsBadges: boolean) {
		const members = this.members();
		if (!members?.length) return;
		const contactsMissing = needsContacts && !members.some((member) => member.contacts !== undefined);
		const badgesMissing = needsBadges && !members.some((member) => member.achievements !== undefined);
		if (contactsMissing || badgesMissing) this.loadMembers(this.filter);
	}
}
