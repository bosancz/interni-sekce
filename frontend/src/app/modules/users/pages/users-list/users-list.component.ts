import { AfterViewInit, Component, OnInit, ViewChild } from "@angular/core";
import { NgForm } from "@angular/forms";
import { ActivatedRoute, Params, Router } from "@angular/router";
import { UntilDestroy, untilDestroyed } from "@ngneat/until-destroy";
import { BehaviorSubject } from "rxjs";
import { debounceTime } from "rxjs/operators";
import { UserResponse, UserResponseRolesEnum } from "src/app/api";
import { UserRoles } from "src/app/config/user-roles";
import { ApiService } from "src/app/services/api.service";
import { Action } from "src/app/shared/components/action-buttons/action-buttons.component";

type UsersFilter = {
  search: string;
  role: UserResponseRolesEnum[];
};

@UntilDestroy()
@Component({
  selector: "users-list",
  templateUrl: "./users-list.component.html",
  styleUrls: ["./users-list.component.scss"],
})
export class UsersListComponent implements OnInit, AfterViewInit {
  users: UserResponse[] = [];
  filteredUsers: UserResponse[] = [];

  searchIndex: string[] = [];
  searchString = new BehaviorSubject<string>("");

  roles = UserRoles.filter((item) => item.assignable);

  @ViewChild("filterForm", { static: true }) filterForm!: NgForm;

  actions: Action[] = [
    {
      text: "Přidat",
      icon: "add-outline",
      pinned: true,
      handler: () => this.router.navigate(["vytvorit"], { relativeTo: this.route }),
    },
  ];

  constructor(private api: ApiService, private route: ActivatedRoute, private router: Router) {}

  ngOnInit() {
    this.route.params.pipe(untilDestroyed(this)).subscribe((params: Params) => {
      this.loadUsers();
    });
  }

  ngAfterViewInit() {
    this.filterForm
      .valueChanges!.pipe(untilDestroyed(this))
      .pipe(debounceTime(250))
      .subscribe(() => this.filterUsers());
  }

  async loadUsers() {
    this.users = await this.api.users.listUsers().then((res) => res.data);

    this.users.sort((a, b) => a.login?.localeCompare(b.login) || 0);

    this.searchIndex = this.users.map((user) => {
      return [user.login, user.member?.nickname, user.member?.firstName, user.member?.lastName]
        .filter((item) => !!item)
        .join(" ");
    });
  }

  filterUsers() {
    const filter: UsersFilter = this.filterForm.value;

    const search_re = filter.search
      ? new RegExp("(^| )" + filter.search.replace(/ /g, "").replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i")
      : undefined;

    this.filteredUsers = this.users.filter((user, i) => {
      if (search_re && !search_re.test(this.searchIndex[i])) return false;
      if (filter.role && filter.role.length && !filter.role.some((filterRole) => user.roles?.includes(filterRole)))
        return false;

      return true;
    });
  }

  getRoleName(roleId: string) {
    return this.roles.find((item) => item.id === roleId)?.title || roleId;
  }
}
