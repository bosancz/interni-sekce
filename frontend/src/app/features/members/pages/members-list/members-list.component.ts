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
import { UntilDestroy, untilDestroyed } from "@ngneat/until-destroy";
import { addIcons } from "ionicons";
import { addOutline, downloadOutline, eyeOutline } from "ionicons/icons";
import { DateTime } from "luxon";
import { MemberRoles } from "src/app/core/config/member-roles";
import { ApiService } from "src/app/core/services/api.service";
import { ModalService } from "src/app/core/services/modal.service";
import { PlatformService } from "src/app/core/services/platform.service";
import { ToastService } from "src/app/core/services/toast.service";
import { Action } from "src/app/shared/components/action-buttons/action-buttons.component";
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
	selectedGroups: string[] = [];
	selectedRoles: string[] = [];
	selectedMembership: string[] = [];
	selectedAges: string[] = [];

	loadingItems = new Array(10).fill(null);

	filter: FilterData = {};

	actions: Action[] = [];

	view?: "table" | "list";

	page = 1;
	pageSize = 50;

	viewSelections: { [key: string]: boolean } = {};

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
		this.api.rootLinks.pipe(untilDestroyed(this)).subscribe(() => {
			this.setActions();
		});

		this.platformService.isPortrait.subscribe((isPortrait) => {
			this.view = isPortrait ? "list" : "table";
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
		this.selectedGroups = this.normalizeFilterValueToArray((filter as any)["groups"]);
		this.selectedRoles = this.normalizeFilterValueToArray((filter as any)["roles"]);
		this.selectedMembership = this.normalizeFilterValueToArray((filter as any)["membership"]);
		this.selectedAges = this.normalizeFilterValueToArray((filter as any)["age"]);
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

		const params: SDK.MembersApiListMembersQueryParams = {
			search: filter.search || undefined,
			offset: (this.page - 1) * this.pageSize,
			roles: this.normalizeFilterValueToArray(filter["roles"]) as SDK.ListMembersRolesEnum[],
			membership: this.normalizeFilterValueToArray(filter["membership"]) as SDK.ListMembersMembershipEnum[],
			age: this.normalizeFilterValueToArray(filter["age"]).map((age) => parseInt(age, 10)),
			limit: this.pageSize,
			groups: this.normalizeFilterValueToArray(filter["groups"]).map((group) => parseInt(group, 10)),
		};

		var members = await this.api.MembersApi.listMembers(params).then((res) => res.data);

		if (this.view == "table") {
			console.log("Loading contacts for members in table view...");
			members = await Promise.all(
				members.map(async (member) => {
					try {
						const contacts = await this.api.MembersApi.listContacts(member.id).then((res) => res.data);

						return { ...member, contacts: contacts };
					} catch (error) {
						console.error(`Failed to load contacts for member ${member.id}`, error);
						return { ...member, contacts: [] }; // Fallback to empty array on failure
					}
				}),
			);
		}

		const currentMembers = this.members() || [];
		this.members.set([...currentMembers, ...members]);
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
		let page = 1;
		let allMembers: SDK.MemberResponseWithLinks[] = [];

		while (true) {
			const members = await this.api.MembersApi.listMembers({
				limit: this.pageSize,
				offset: (page - 1) * this.pageSize,
			}).then((res) => res.data);

			allMembers = [...allMembers, ...members];

			if (members.length < this.pageSize) break;
			page++;
		}

		const ages = allMembers
			.map((member) => member.birthday)
			.filter((birthday): birthday is string => !!birthday)
			.map((birthday) => Number(this.getAge(birthday)))
			.filter((age) => Number.isFinite(age));

		this.allMemberAges.set([...new Set(ages)].sort((a, b) => a - b));
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
		this.viewSelections = {
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
		};
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
	
	private setActions() {
		this.actions = [
			{
				icon: "add-outline",
				pinned: true,
				text: "Přidat",
				handler: () => this.create(),
			},
			{
				icon: "download-outline",
				pinned: true,
				text: "Stáhnout XLSX",
				handler: () => this.export(),
			},
		];
	}
}
