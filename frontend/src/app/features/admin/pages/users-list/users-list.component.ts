import { KeyValuePipe } from "@angular/common";
import { Component, OnInit, signal } from "@angular/core";
import { FormsModule } from "@angular/forms";
import { Router, RouterLink } from "@angular/router";
import {
	InfiniteScrollCustomEvent,
	IonBadge,
	IonContent,
	IonInfiniteScroll,
	IonInfiniteScrollContent,
	IonItem,
	IonLabel,
	IonList,
	IonSelect,
	IonSelectOption,
	ViewWillEnter,
} from "@ionic/angular/standalone";
import { ModalService } from "src/app/core/services/modal.service";
import { UntilDestroy, untilDestroyed } from "@ngneat/until-destroy";
import { addIcons } from "ionicons";
import { addOutline } from "ionicons/icons";
import { ShownUserRoles, UserRoles } from "src/app/core/config/user-roles";
import { UserRolesPipe } from "src/app/shared/pipes/user-roles.pipe";
import { ApiService } from "src/app/core/services/api.service";
import { PlatformService } from "src/app/core/services/platform.service";
import { ToastService } from "src/app/core/services/toast.service";
import { Action } from "src/app/shared/components/action-buttons/action-buttons.component";
import { AdminTableComponent } from "src/app/shared/components/admin-table/admin-table.component";
import { FilterComponent, FilterData } from "src/app/shared/components/filter/filter.component";
import { PageHeaderComponent } from "src/app/shared/components/page-header/page-header.component";
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
		UserRolesPipe,
		FormsModule,
		RouterLink,
		KeyValuePipe,
		IonContent,
		IonList,
		IonItem,
		IonLabel,
		IonSelect,
		IonSelectOption,
		IonInfiniteScroll,
		IonInfiniteScrollContent,
		IonBadge,
		PageHeaderComponent,
		FilterComponent,
		AdminTableComponent,
	],
})
export class UsersListComponent implements OnInit, ViewWillEnter {
	users = signal<SDK.UserResponseWithLinks[] | undefined>(undefined);

	userRoles = UserRoles;

	shownUserRoles = ShownUserRoles;

	filter = signal<FilterData>({});

	actions = signal<Action[]>([
		{
			text: "Nový uživatel",
			icon: "add-outline",
			pinned: true,
			handler: () => this.create(),
		},
	]);

	page = signal(1);
	pageSize = 50;

	view = signal<"table" | "list" | undefined>(undefined);

	constructor(
		private api: ApiService,
		private router: Router,
		private platformService: PlatformService,
		private modalService: ModalService,
		private toastService: ToastService,
	) {
		addIcons({ addOutline });
	}

	ngOnInit(): void {
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
		const currentUsers = this.users();
		const currentPage = this.page();
		if (loadMore) {
			if (currentUsers && currentUsers.length < currentPage * this.pageSize) return;
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

		const newUsers = await this.api.UsersApi.listUsers(params).then((res: any) => res.data);

		const existingUsers = this.users() || [];
		this.users.set([...existingUsers, ...newUsers]);
	}

	getRoleName(roleId: SDK.UserRolesEnum) {
		return UserRoles[roleId];
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
		const user = await this.api.UsersApi.createUser(userData).then((res) => res.data);

		this.toastService.toast("Uživatel vytvořen.");

		await this.router.navigate(["/admin/uzivatele", user.id]);
	}
}
