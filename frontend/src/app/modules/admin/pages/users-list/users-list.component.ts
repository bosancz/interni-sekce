import { Component, OnInit } from "@angular/core";
import { ActivatedRoute, Router } from "@angular/router";
import { InfiniteScrollCustomEvent, ViewWillEnter } from "@ionic/angular";
import { UntilDestroy } from "@ngneat/until-destroy";
import { UserRoles } from "src/app/config/user-roles";
import { ApiService } from "src/app/services/api.service";
import { PlatformService } from "src/app/services/platform.service";
import { Action } from "src/app/shared/components/action-buttons/action-buttons.component";
import { FilterData } from "src/app/shared/components/filter/filter.component";
import { SDK } from "src/sdk";

type UsersFilter = {
	search: string;
	role: SDK.UserRolesEnum[];
};

@UntilDestroy()
@Component({
	selector: "users-list",
	templateUrl: "./users-list.component.html",
	styleUrls: ["./users-list.component.scss"],
	standalone: false,
})
export class UsersListComponent implements OnInit, ViewWillEnter {
	users?: SDK.UserResponseWithLinks[] = [];

	userRoles = UserRoles;

	filter: FilterData = {};

	actions: Action[] = [];

	page = 1;
	pageSize = 50;

	view?: "table" | "list";

	constructor(
		private api: ApiService,
		private route: ActivatedRoute,
		private router: Router,
		private platformService: PlatformService,
	) {}

	ngOnInit(): void {
		this.setActions();

		this.platformService.isPortrait.subscribe((isPortrait) => {
			this.view = isPortrait ? "list" : "table";
		});
	}

	ionViewWillEnter(): void {}

	ngAfterViewInit() {}

	async onFilterChange(filter: FilterData) {
		this.filter = filter;
		await this.loadUsers(filter);
	}

	async onInfiniteScroll(event: InfiniteScrollCustomEvent) {
		await this.loadUsers(this.filter, true);
		event.target.complete();
	}

	private async loadUsers(filter: FilterData, loadMore: boolean = false) {
		if (loadMore) {
			if (this.users && this.users.length < this.page * this.pageSize) return;
			this.page++;
		} else {
			this.page = 1;
			this.users = undefined;
		}

		const params: SDK.UsersApiListUsersQueryParams = {
			search: filter.search || undefined,
			roles: filter.roles || undefined,
			limit: this.pageSize,
			offset: (this.page - 1) * this.pageSize,
		};

		const users = await this.api.UsersApi.listUsers(params).then((res) => res.data);

		if (!this.users) this.users = [];
		this.users.push(...users);
	}

	getRoleName(roleId: SDK.UserRolesEnum) {
		return UserRoles[roleId];
	}

	private setActions(): void {
		// TODO: check permissions
		this.actions = [
			{
				text: "Přidat",
				icon: "add-outline",
				pinned: true,
				handler: () => this.router.navigate(["/admin/uzivatele/vytvorit"], { relativeTo: this.route }),
			},
		];
	}
}
