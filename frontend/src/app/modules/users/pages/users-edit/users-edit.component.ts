import { Component, OnInit, ViewChild } from "@angular/core";
import { NgForm } from "@angular/forms";
import { ActivatedRoute, Params, Router } from "@angular/router";
import { UntilDestroy, untilDestroyed } from "@ngneat/until-destroy";
import { MemberResponse, UserResponseWithLinks, UserResponseWithLinksRolesEnum } from "src/app/api";
import { ApiService } from "src/app/services/api.service";
import { ToastService } from "src/app/services/toast.service";
import { Action } from "src/app/shared/components/action-buttons/action-buttons.component";

@UntilDestroy()
@Component({
  selector: "bo-users-edit",
  templateUrl: "./users-edit.component.html",
  styleUrls: ["./users-edit.component.scss"],
})
export class UsersEditComponent implements OnInit {
  user?: UserResponseWithLinks;

  roles = Object.entries(UserResponseWithLinksRolesEnum).map(([title, name]) => ({
    name,
    title,
    active: false,
  }));

  members: MemberResponse[] = [];

  category: string = "ucet";

  actions: Action[] = [
    {
      text: "Uložit",
      handler: () => this.saveUser(),
    },
  ];

  @ViewChild("editUserForm") form!: NgForm;

  constructor(
    private api: ApiService,
    private toastService: ToastService,
    private route: ActivatedRoute,
    private router: Router,
  ) {}

  ngOnInit() {
    this.route.params.pipe(untilDestroyed(this)).subscribe((params: Params) => {
      if (params.user && (!this.user || this.user.id !== params.user)) this.loadUser(params.user);

      this.category = params.cat;
    });

    this.loadMembers();
  }

  // DB interaction
  async loadUser(userId: number) {
    this.user = await this.api.users.getUser(userId).then((res) => res.data);
    this.updateRoles(this.user);
  }

  updateRoles(user: UserResponseWithLinks): void {
    this.roles.forEach((role) => (role.active = user.roles?.includes(role.name) ?? false));
  }

  async loadMembers() {
    let members = await this.api.members.listMembers().then((res) => res.data);
    members.sort((a, b) => (a.nickname || "").localeCompare(b.nickname || ""));
    this.members = members;
  }

  async saveUser() {
    if (!this.user) return;

    const userData = this.form.value;

    await this.api.users.updateUser(this.user.id, userData);

    this.toastService.toast("Uloženo.");

    this.router.navigate(["../"], { relativeTo: this.route, replaceUrl: true });
  }

  hasRole(name: string) {
    return this.roles.some((role) => role.name === name && role.active === true);
  }
}
