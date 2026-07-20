import { DatePipe, KeyValue, KeyValuePipe } from "@angular/common";
import { AfterViewInit, Component, OnInit, signal } from "@angular/core";
import { FormsModule } from "@angular/forms";
import { ActivatedRoute, Router, RouterLink } from "@angular/router";
import {
	InfiniteScrollCustomEvent,
	IonButton,
	IonCheckbox,
	IonContent,
	IonIcon,
	IonInfiniteScroll,
	IonInfiniteScrollContent,
	IonItem,
	IonLabel,
	IonList,
	IonPopover,
	IonSelect,
	IonSelectOption,
	IonSkeletonText,
	ViewWillEnter,
} from "@ionic/angular/standalone";
import { UntilDestroy } from "@ngneat/until-destroy";
import { addIcons } from "ionicons";
import { addOutline, downloadOutline, eyeOutline } from "ionicons/icons";
import { DateTime } from "luxon";
import { MemberRoles } from "src/app/core/config/member-roles";
import { ApiService } from "src/app/core/services/api.service";
import { ModalService } from "src/app/core/services/modal.service";
import { PlatformService } from "src/app/core/services/platform.service";
import { ToastService } from "src/app/core/services/toast.service";
import { AdminTableComponent } from "src/app/shared/components/admin-table/admin-table.component";
import { FilterComponent, FilterData } from "src/app/shared/components/filter/filter.component";
import { GroupBadgeComponent } from "src/app/shared/components/group-badge/group-badge.component";
import { PageHeaderComponent } from "src/app/shared/components/page-header/page-header.component";
import { GroupPipe } from "src/app/shared/pipes/group.pipe";
import { MemberPipe } from "src/app/shared/pipes/member.pipe";
import { SDK } from "src/sdk";
import { MembershipStates } from "../../../../core/config/membership-states";
import { MemberCreateModalComponent } from "../../components/member-create-modal/member-create-modal.component";

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
		IonLabel,
		IonSkeletonText,
		IonSelect,
		IonSelectOption,
		IonButton,
		IonPopover,
		IonCheckbox,
		IonIcon,
		AdminTableComponent,
		FormsModule,
		RouterLink,
		KeyValuePipe,
		GroupPipe,
		MemberPipe,
		GroupBadgeComponent,
		IonInfiniteScroll,
		IonInfiniteScrollContent,
		DatePipe,
	],
})
export class MembersListComponent implements OnInit, AfterViewInit, ViewWillEnter {
	members = signal<SDK.MemberResponseWithLinks[] | undefined>(undefined);
	groups = signal<SDK.GroupResponseWithLinks[]>([]);
	roles = MemberRoles;
	membershipStates = MembershipStates;
	allMemberAges = signal<number[]>([]);
	selectedGroups = signal<string[]>([]);
	selectedRoles = signal<string[]>([]);
	selectedMembership = signal<string[]>([]);
	selectedAges = signal<string[]>([]);

	loadingItems = new Array(10).fill(null);

	filter: FilterData = {};


	view = signal<"table" | "list" | undefined>(undefined);

	page = 1;
	pageSize = 50;

	private latestLoadId = 0;

	viewSelections = signal<{ [key: string]: boolean }>({});

	constructor(
		private api: ApiService,
		private route: ActivatedRoute,
		private router: Router,
		private toasts: ToastService,
		private platformService: PlatformService,
		private modalService: ModalService,
	) {
		addIcons({ addOutline, downloadOutline, eyeOutline });
	}

	ngOnInit() {}

	ngAfterViewInit(): void {
		this.platformService.isPortrait.subscribe((isPortrait) => {
			this.view.set(isPortrait ? "list" : "table");
		});

		this.loadViewSelections();
	}

	ionViewWillEnter() {
		this.loadGroups();
		this.loadAllAges();
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
			age: this.normalizeFilterValueToArray((this.filter as any)["age"]).map((age) => parseInt(age, 10)),
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

	onFilterChange(filter: FilterData) {
		// FIXME: do not use as any
		this.filter = filter;
		this.selectedGroups.set(this.normalizeFilterValueToArray((filter as any)["groups"]));
		this.selectedRoles.set(this.normalizeFilterValueToArray((filter as any)["roles"]));
		this.selectedMembership.set(this.normalizeFilterValueToArray((filter as any)["membership"]));
		this.selectedAges.set(this.normalizeFilterValueToArray((filter as any)["age"]));
		this.loadMembers(filter);
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
			age: this.normalizeFilterValueToArray(filter["age"]).map((age) => parseInt(age, 10)),
			limit: this.pageSize,
			groups: this.normalizeFilterValueToArray(filter["groups"]).map((group) => parseInt(group, 10)),
			// default: active only; "all" reveals inactive members too
			active: ((filter["active"] as string) || "active") === "all" ? undefined : true,
			// Fetch contacts in the same request instead of one call per member,
			// and only when a contact column is actually visible.
			contacts: this.needsContacts() || undefined,
		};

		const members = await this.api.MembersApi.listMembers(params).then((res) => res.data);

		if (loadId !== this.latestLoadId) return;

		const currentMembers = this.members() || [];
		this.members.set([...currentMembers, ...members]);
	}

	// Contacts are only needed when the phone/email columns are shown in the table view.
	private needsContacts(): boolean {
		if (this.view() !== "table") return false;
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
		this.groups.set(groups);
	}

	private async loadAllAges() {
		// Single aggregated request instead of paging through the whole members table
		// just to collect the distinct ages for the filter dropdown.
		const ages = await this.api.MembersApi.listMemberAges().then((res) => res.data);

		this.allMemberAges.set([...new Set(ages)].filter((age) => Number.isFinite(age)).sort((a, b) => a - b));
	}

	async create() {
		const memberData = await this.modalService.componentModal(MemberCreateModalComponent);
		if (!memberData) return;

		const member = await this.api.MembersApi.createMember(memberData).then((res) => res.data);
		this.toasts.toast("Člen uložen.");

		this.router.navigate([member.id], { relativeTo: this.route });
	}

	getAge(birthday: string) {
		return Math.floor(-1 * DateTime.fromISO(birthday).diffNow("years").years).toFixed(0);
	}

	get availableAges(): number[] {
		return this.allMemberAges();
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
			age: false,
			membership: false,
			birthday: false,
			addressCity: false,
			addressStreet: false,
			firstTelephone: false,
			firstEmail: false,
		});
	}

	setViewSelection(key: string, value: boolean) {
		this.viewSelections.update((selections) => ({ ...selections, [key]: value }));

		// Enabling a contact column after the list was already loaded without contacts:
		// re-fetch so the newly visible column has data (still a single request).
		if (value && (key === "firstTelephone" || key === "firstEmail")) {
			const members = this.members();
			const contactsLoaded = !!members?.some((member) => member.contacts !== undefined);
			if (!contactsLoaded) this.loadMembers(this.filter);
		}
	}

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
		};

		return labels[key] || key;
	}
	
}
