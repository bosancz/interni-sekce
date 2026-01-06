import { KeyValuePipe } from "@angular/common";
import { AfterViewInit, Component, OnInit } from "@angular/core";
import { FormsModule } from "@angular/forms";
import { ActivatedRoute, Router, RouterLink } from "@angular/router";
import { InfiniteScrollCustomEvent, ViewWillEnter } from "@ionic/angular";
import {
	IonContent,
	IonItem,
	IonLabel,
	IonList,
	IonSelect,
	IonSelectOption,
	IonSkeletonText,
} from "@ionic/angular/standalone";
import { UntilDestroy, untilDestroyed } from "@ngneat/until-destroy";
import { DateTime } from "luxon";
import { MemberRoles } from "src/app/config/member-roles";
import { ApiService } from "src/app/services/api.service";
import { PlatformService } from "src/app/services/platform.service";
import { ToastService } from "src/app/services/toast.service";
import { Action } from "src/app/shared/components/action-buttons/action-buttons.component";
import { AdminTableComponent } from "src/app/shared/components/admin-table/admin-table.component";
import { FilterComponent, FilterData } from "src/app/shared/components/filter/filter.component";
import { PageHeaderComponent } from "src/app/shared/components/page-header/page-header.component";
import { GroupPipe } from "src/app/shared/pipes/group.pipe";
import { MemberPipe } from "src/app/shared/pipes/member.pipe";
import { SDK } from "src/sdk";
import { MembershipStates } from "../../../../config/membership-states";

@UntilDestroy()
@Component({
	selector: "members-list",
	templateUrl: "./members-list.component.html",
	styleUrls: ["./members-list.component.scss"],
	standalone: true,
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
		AdminTableComponent,
		FormsModule,
		RouterLink,
		KeyValuePipe,
		GroupPipe,
		MemberPipe,
	],
})
export class MembersListComponent implements OnInit, AfterViewInit, ViewWillEnter {
	members?: SDK.MemberResponseWithLinks[];
	groups?: SDK.GroupResponseWithLinks[];
	roles = MemberRoles;
	membershipStates = MembershipStates;

	loadingItems = new Array(10).fill(null);

	filter: FilterData = {};

	actions: Action[] = [];

	view?: "table" | "list";

	page = 1;
	pageSize = 100;

	constructor(
		private api: ApiService,
		private route: ActivatedRoute,
		private router: Router,
		private toasts: ToastService,
		private platformService: PlatformService,
	) {}

	ngOnInit() {}

	ngAfterViewInit(): void {
		this.api.rootLinks.pipe(untilDestroyed(this)).subscribe(() => {
			this.setActions();
		});

		this.platformService.isPortrait.subscribe((isPortrait) => {
			this.view = isPortrait ? "list" : "table";
		});
	}

	ionViewWillEnter() {
		this.loadGroups();
	}

	export() {
		this.api.MembersApi.exportMembersXlsx({}, { responseType: "blob" }).then((res) => {
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
		this.filter = filter;
		this.loadMembers(filter);
	}

	async onInfiniteScroll(e: InfiniteScrollCustomEvent) {
		await this.loadMembers(this.filter, true);
		e.target.complete();
	}

	private async loadMembers(filter: FilterData, loadMore: boolean = false) {
		if (loadMore) {
			if (this.members && this.members.length < this.page * this.pageSize) return;
			this.page++;
		} else {
			this.page = 1;
			this.members = undefined;
		}

		const params: SDK.MembersApiListMembersQueryParams = {
			search: filter.search || undefined,
			offset: (this.page - 1) * this.pageSize,
			roles: filter.roles || undefined,
			membership: filter.membership || undefined,
			limit: this.pageSize,
			groups: filter.groups || undefined,
		};

		const members = await this.api.MembersApi.listMembers(params).then((res) => res.data);

		if (!this.members) this.members = [];
		this.members.push(...members);
	}

	private async loadGroups() {
		this.groups = await this.api.MembersApi.listGroups().then((res) => res.data);
	}

	private create() {
		this.router.navigate(["pridat"], { relativeTo: this.route });
	}

	getAge(birthday: string) {
		return Math.floor(-1 * DateTime.fromISO(birthday).diffNow("years").years).toFixed(0);
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
