import { Component, OnInit, signal } from "@angular/core";
import { FormsModule } from "@angular/forms";
import { ActivatedRoute, Router, RouterLink } from "@angular/router";
import { InfiniteScrollCustomEvent, ViewWillEnter } from "@ionic/angular";
import { KeyValuePipe } from "@angular/common";
import {
	IonContent,
	IonItem,
	IonLabel,
	IonList,
	IonSelect,
	IonSelectOption,
	IonSkeletonText,
	IonInfiniteScroll,
	IonInfiniteScrollContent,
	IonBadge,
} from "@ionic/angular/standalone";
import { UntilDestroy, untilDestroyed } from "@ngneat/until-destroy";
import { UserRoles } from "src/app/core/config/user-roles";
import { ApiService } from "src/app/services/api.service";
import { PlatformService } from "src/app/services/platform.service";
import { Action } from "src/app/shared/components/action-buttons/action-buttons.component";
import { FilterComponent, FilterData } from "src/app/shared/components/filter/filter.component";
import { PageHeaderComponent } from "src/app/shared/components/page-header/page-header.component";
import { AdminTableComponent } from "src/app/shared/components/admin-table/admin-table.component";
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
	
	imports: [
		FormsModule,
		RouterLink,
		KeyValuePipe,
		IonContent,
		IonList,
		IonItem,
		IonLabel,
		IonSkeletonText,
		IonSelect,
		IonSelectOption,
		IonInfiniteScroll,
		IonInfiniteScrollContent,
		PageHeaderComponent,
		FilterComponent,
		AdminTableComponent,
	],
})
export class UsersListComponent implements OnInit, ViewWillEnter {
	users = signal<SDK.UserResponseWithLinks[] | undefined>(undefined);

	userRoles = UserRoles;

	filter = signal<FilterData>({});

	actions = signal<Action[]>([]);

	page = signal(1);
	pageSize = 50;

	view = signal<"table" | "list" | undefined>(undefined);

	constructor(
		private api: ApiService,
		private route: ActivatedRoute,
		private router: Router,
		private platformService: PlatformService,
	) {}

	ngOnInit(): void {
		this.setActions();

		this.platformService.isPortrait.pipe(untilDestroyed(this)).subscribe((isPortrait) => {
			this.view.set(isPortrait ? "list" : "table");
		});
	}

	ionViewWillEnter(): void {}

	ngAfterViewInit() {}

	async onFilterChange(filter: FilterData) {
		this.filter.set(filter);
		await this.loadUsers(filter);
	}

	async onInfiniteScroll(event: InfiniteScrollCustomEvent) {
		await this.loadUsers(this.filter(), true);
		event.target.complete();
	}

	private async loadUsers(filter: FilterData, loadMore: boolean = false) {
		const users = this.users();
		const currentPage = this.page();
		if (loadMore) {
			if (users && users.length < currentPage * this.pageSize) return;
			this.page.set(currentPage + 1);
		} else {
			this.page.set(1);
			this.users.set(undefined);
		}

		const params: SDK.UsersApiListUsersQueryParams = {
			search: filter.search || undefined,
			roles: filter.roles || undefined,
			limit: this.pageSize,
			offset: (this.page() - 1) * this.pageSize,
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
		]);
	}
}
