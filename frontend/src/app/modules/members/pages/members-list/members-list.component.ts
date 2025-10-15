import { AfterViewInit, Component, OnInit } from "@angular/core";
import { ActivatedRoute, Router } from "@angular/router";
import { InfiniteScrollCustomEvent, Platform, ViewWillEnter } from "@ionic/angular";
import { UntilDestroy, untilDestroyed } from "@ngneat/until-destroy";
import { DateTime } from "luxon";
import { MemberRoles } from "src/app/config/member-roles";
import { ToastService } from "src/app/services/toast.service";
import { Action } from "src/app/shared/components/action-buttons/action-buttons.component";
import { FilterData } from "src/app/shared/components/filter/filter.component";
import { MembershipStates } from "../../../../config/membership-states";

@UntilDestroy()
@Component({
	selector: "members-list",
	templateUrl: "./members-list.component.html",
	styleUrls: ["./members-list.component.scss"],
	standalone: false,
})
export class MembersListComponent implements OnInit, AfterViewInit, ViewWillEnter {
	members?: BackendApiTypes.MemberResponseWithLinks[];
	groups?: BackendApiTypes.GroupResponseWithLinks[];
	roles = MemberRoles;
	membershipStates = MembershipStates;

	loadingItems = new Array(10).fill(null);

	filter: FilterData = {};

	actions: Action[] = [];

	view?: "table" | "list";

	page = 1;
	pageSize = 100;

	constructor(
		private api: BackendApi,
		private route: ActivatedRoute,
		private router: Router,
		private toasts: ToastService,
		private platform: Platform,
	) {}

	ngOnInit() {}

	ngAfterViewInit(): void {
		this.api.rootLinks.pipe(untilDestroyed(this)).subscribe(() => {
			this.setActions();
		});

		this.updateView();
		this.platform.resize.pipe(untilDestroyed(this)).subscribe(() => this.updateView());
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

		const params: BackendApiTypes.MembersApiListMembersQueryParams = {
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

	private updateView() {
		this.view = this.platform.isPortrait() ? "list" : "table";
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
