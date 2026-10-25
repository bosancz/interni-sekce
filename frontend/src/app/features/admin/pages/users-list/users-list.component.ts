import { NgTemplateOutlet } from "@angular/common";
import { Component, computed, inject, OnInit, signal } from "@angular/core";
import { ActivatedRoute, Params, Router } from "@angular/router";
import {
	InfiniteScrollCustomEvent,
	IonInfiniteScroll,
	IonInfiniteScrollContent,
	ViewWillEnter,
	ViewWillLeave,
} from "@ionic/angular/standalone";
import { UntilDestroy, untilDestroyed } from "@ngneat/until-destroy";
import { addIcons } from "ionicons";
import { addOutline } from "ionicons/icons";
import { ShownUserRoles, UserRoles } from "src/app/core/config/user-roles";
import { ApiService } from "src/app/core/services/api.service";
import { ModalService } from "src/app/core/services/modal.service";
import { PlatformService } from "src/app/core/services/platform.service";
import { ToastService } from "src/app/core/services/toast.service";
import { Action } from "src/app/shared/components/action-buttons/action-buttons.component";
import { AdminTableCellDirective } from "src/app/shared/components/admin-table/admin-table-cell.directive";
import { AdminTableColumnComponent } from "src/app/shared/components/admin-table/admin-table-column.component";
import { AdminTableComponent, AdminTableSort } from "src/app/shared/components/admin-table/admin-table.component";
import { FilterPillComponent, FilterPillOption } from "src/app/shared/components/filter-pill/filter-pill.component";
import { FilterModel, FilterValues } from "src/app/shared/components/filter/filter-model";
import { FilterComponent } from "src/app/shared/components/filter/filter.component";
import { PageContentComponent } from "src/app/shared/components/page-content/page-content.component";
import { PageHeaderComponent } from "src/app/shared/components/page-header/page-header.component";
import { SortOption, SortSelectComponent } from "src/app/shared/components/sort-select/sort-select.component";
import { UserRolesPipe } from "src/app/shared/pipes/user-roles.pipe";
import { getPagesToLoad, getParamsKey, ListLoadMode } from "src/helpers/list-loading";
import { UrlParams } from "src/helpers/typings";
import { SDK } from "src/sdk";

@UntilDestroy()
@Component({
	selector: "users-list",
	templateUrl: "./users-list.component.html",
	styleUrls: ["./users-list.component.scss"],

	imports: [
		UserRolesPipe,
		NgTemplateOutlet,
		IonInfiniteScroll,
		IonInfiniteScrollContent,
		PageHeaderComponent,
		PageContentComponent,
		FilterComponent,
		FilterPillComponent,
		SortSelectComponent,
		AdminTableComponent,
		AdminTableColumnComponent,
		AdminTableCellDirective,
	],
	providers: [FilterModel],
})
export class UsersListComponent implements OnInit, ViewWillEnter, ViewWillLeave {
	users = signal<SDK.UserResponseWithLinks[] | undefined>(undefined);

	userRoles = UserRoles;

	private model = inject(FilterModel);

	selectedRoles = computed(() => this.normalizeFilterValueToArray(this.model.value("roles")));

	sortColumn = computed<string | null>(() => (this.model.value("sort") as string) ?? null);
	sortOrder = computed<"ASC" | "DESC">(() => (this.model.value("order") === "DESC" ? "DESC" : "ASC"));

	readonly sortOptions: SortOption[] = [
		{ key: "login", label: "Login" },
		{ key: "member", label: "Člen" },
		{ key: "email", label: "E-mail" },
	];

	readonly roleOptions: FilterPillOption[] = Object.entries(ShownUserRoles).map(([key, role]) => ({
		value: key,
		label: role!.title,
	}));

	actions = signal<Action[]>([
		{
			text: "Nový uživatel",
			icon: "add-outline",
			pinned: true,
			handler: () => this.create(),
		},
	]);

	rowLink = (user: SDK.UserResponseWithLinks) => ["/admin/uzivatele", user.id];

	isDesktop = signal(true);

	filter: UrlParams = {};

	page = 1;
	readonly pageSize = 50;

	private loadToken = 0;

	private loadedFilterKey: string | null = null;

	private hasLeft = false;

	constructor(
		private api: ApiService,
		private route: ActivatedRoute,
		private router: Router,
		private platformService: PlatformService,
		private modalService: ModalService,
		private toastService: ToastService,
	) {
		addIcons({ addOutline });
		this.platformService.isLg.pipe(untilDestroyed(this)).subscribe((isLg) => this.isDesktop.set(isLg));
	}

	ngOnInit(): void {
		this.route.queryParams.pipe(untilDestroyed(this)).subscribe((params) => this.onParams(params));
		this.model.apply$.pipe(untilDestroyed(this)).subscribe((filter) => this.applyFilter(filter));
	}

	ionViewWillEnter(): void {
		if (this.hasLeft) this.loadUsers(this.filter, "refresh");
	}

	ionViewWillLeave(): void {
		this.hasLeft = true;
	}

	onParams(params: Params) {
		this.model.setCommitted(this.modelFromParams(params));

		const filterKey = getParamsKey(params);
		if (filterKey === this.loadedFilterKey) return;
		this.loadedFilterKey = filterKey;

		this.filter = { ...params };
		this.loadUsers(this.filter);
	}

	private modelFromParams(p: Params): FilterValues {
		return {
			roles: this.normalizeFilterValueToArray(p["roles"]),
			sort: p["sort"] ?? null,
			order: p["order"] ?? null,
		};
	}

	private applyFilter(filter: FilterValues) {
		const roles = this.normalizeFilterValueToArray(filter["roles"]);
		this.router.navigate([], {
			queryParams: {
				roles: roles.length ? roles.join(",") : null,
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
		try {
			await this.loadUsers(this.filter, "more");
		} finally {
			e.target.complete();
		}
	}

	private async loadUsers(filter: UrlParams, mode: ListLoadMode = "reset") {
		if (mode === "more") {
			const currentUsers = this.users();
			if (!currentUsers || currentUsers.length < this.page * this.pageSize) return;
			this.page++;
		} else if (mode === "reset") {
			this.page = 1;
			this.users.set(undefined);
		}

		const params: SDK.UsersApiListUsersQueryParams = {
			search: filter.search || undefined,
			roles: this.normalizeFilterValueToArray(filter.roles) as SDK.UserRolesEnum[],
			sort: (filter.sort as string) || undefined,
			order: (filter.order as SDK.ListUsersOrderEnum) || undefined,
			limit: this.pageSize,
		};

		const token = ++this.loadToken;

		const pages = await Promise.all(
			getPagesToLoad(mode, this.page).map((page) =>
				this.api.UsersApi.listUsers({ ...params, offset: (page - 1) * this.pageSize }).then((res) => res.data),
			),
		).catch((err) => {
			if (mode === "refresh") return null;
			throw err;
		});

		if (token !== this.loadToken || !pages) return;

		const users = pages.flat();
		this.users.set(mode === "more" ? [...(this.users() ?? []), ...users] : users);
	}

	private normalizeFilterValueToArray(value: unknown): string[] {
		if (Array.isArray(value)) return value.filter((item) => !!item).map((item) => String(item));
		if (!value) return [];

		return String(value)
			.split(",")
			.map((item) => item.trim())
			.filter((item) => !!item);
	}

	create() {
		this.createUserModal();
	}

	private async createUserModal() {
		const data = await this.modalService.inputModal<SDK.UserCreateBody>({
			header: "Vytvořit uživatelský účet",
			inputs: {
				login: { label: "Login", type: "text", required: true },
				email: { label: "E-mail (nepovinný)", type: "email" },
			},
			buttonText: "Vytvořit",
		});
		if (data) this.onCreateUser(data);
	}

	private onCreateUser(userData: SDK.UserCreateBody) {
		if (!userData.login) {
			this.toastService.toast("Musíš vyplnit login.");
			return false;
		}

		this.createUser(userData);
	}

	private async createUser(userData: SDK.UserCreateBody) {
		const user = await this.api.UsersApi.createUser(userData)
			.then((res) => res.data)
			.catch((err) => {
				if (err?.response?.status !== 409) throw err;
				this.toastService.toast(err.response.data?.message, { color: "danger" });
				return null;
			});
		if (!user) return;

		this.toastService.toast("Uživatel vytvořen.");

		await this.router.navigate(["/admin/uzivatele", user.id]);
	}
}
