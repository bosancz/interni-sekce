import { AfterViewInit, Component, OnInit } from "@angular/core";
import { FormControl, FormGroup } from "@angular/forms";
import { ActivatedRoute, Params, Router } from "@angular/router";
import { ActionSheetController, Platform } from "@ionic/angular";
import { UntilDestroy, untilDestroyed } from "@ngneat/until-destroy";
import { UserResponseWithLinks, UserRolesEnum, UsersApiListUsersQueryParams } from "src/app/api";
import { UserRoles } from "src/app/config/user-roles";
import { ApiService } from "src/app/services/api.service";
import { Action } from "src/app/shared/components/action-buttons/action-buttons.component";
import { UrlParams } from "src/helpers/typings";

type UsersFilter = {
  search: string;
  role: UserRolesEnum[];
};

@UntilDestroy()
@Component({
  selector: "users-list",
  templateUrl: "./users-list.component.html",
  styleUrls: ["./users-list.component.scss"],
})
export class UsersListComponent implements OnInit, AfterViewInit {
  users: UserResponseWithLinks[] = [];

  userRoles = UserRoles;

  filterForm = new FormGroup({
    search: new FormControl<string | null>(null),
    roles: new FormControl<string[] | null>(null),
  });

  actions: Action[] = [
    {
      text: "Přidat",
      icon: "add-outline",
      pinned: true,
      handler: () => this.router.navigate(["vytvorit"], { relativeTo: this.route }),
    },
  ];

  constructor(
    private api: ApiService,
    private route: ActivatedRoute,
    private router: Router,
    private actionSheetController: ActionSheetController,
    private platform: Platform,
  ) {}

  ngOnInit() {
    this.route.queryParams.pipe(untilDestroyed(this)).subscribe((params: Params) => this.onParamsChange(params));
  }

  ngAfterViewInit() {}

  private async loadUsers() {
    const params: UsersApiListUsersQueryParams = {
      search: this.filterForm.value.search || undefined,
      roles: this.filterForm.value.roles?.join(",") || undefined,
    };
    this.users = await this.api.users.listUsers(params).then((res) => res.data);
  }

  setParams(params: UrlParams) {
    this.router.navigate([], { replaceUrl: true, queryParams: params });
  }

  onFilterChange() {
    const filter = this.filterForm.value;

    this.setParams({
      search: filter.search || undefined,
      roles: filter.roles?.join(",") || undefined,
    });
  }

  resetFilter() {
    this.setFilter(this.route.snapshot.queryParams);
  }

  getRoleName(roleId: UserRolesEnum) {
    return UserRoles[roleId];
  }

  private async onParamsChange(queryParams: UrlParams) {
    this.setFilter(queryParams);
    await this.loadUsers();
  }

  private setFilter(data: UrlParams) {
    this.filterForm.setValue({
      search: data.search || null,
      roles: data.roles ? data.roles.split(",") : null,
    });
  }
}
