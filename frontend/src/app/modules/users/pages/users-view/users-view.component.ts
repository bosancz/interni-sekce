import { Component, OnInit } from "@angular/core";
import { ActivatedRoute, Params, Router } from "@angular/router";
import { UntilDestroy, untilDestroyed } from "@ngneat/until-destroy";
import { UserResponse } from "src/app/api";
import { UserRoles } from "src/app/config/user-roles";
import { ApiService } from "src/app/services/api.service";
import { LoginService } from "src/app/services/login.service";
import { ToastService } from "src/app/services/toast.service";
import { Action } from "src/app/shared/components/action-buttons/action-buttons.component";

@UntilDestroy()
@Component({
  selector: "users-view",
  templateUrl: "./users-view.component.html",
  styleUrls: ["./users-view.component.scss"],
})
export class UsersViewComponent implements OnInit {
  user?: UserResponse;

  roles = UserRoles.filter((item) => item.assignable).map((role) => ({
    name: role.id,
    title: role.title,
    active: false,
  }));

  actions: Action[] = [];

  constructor(
    private api: ApiService,
    private toastService: ToastService,
    private loginService: LoginService,
    private route: ActivatedRoute,
    private router: Router,
  ) {}

  ngOnInit() {
    this.route.params.pipe(untilDestroyed(this)).subscribe((params: Params) => {
      if (params.user) this.loadUser(params.user);
    });
  }

  // DB interaction
  async loadUser(userId: number) {
    const user = await this.api.users.getUser(userId).then((res) => res.data);

    this.actions = this.getActions(user);
  }

  async setPassword() {
    if (!this.user) return;

    const password = window.prompt("Zadej nové heslo:");

    if (!password) return;

    await this.api.users.setUserPassword(this.user.id, { password });

    this.toastService.toast("Heslo nastaveno.");
  }
  async deleteUser() {
    if (!this.user) return;

    const confirmation = window.confirm(`Opravdu smazat uživatele ${this.user.login}?`);

    if (!confirmation) return;

    await this.api.users.deleteUser(this.user.id);

    this.toastService.toast(`Uživatel byl smazán.`);

    this.router.navigate(["../../"], { relativeTo: this.route });
  }

  async impersonateUser(user: UserResponse): Promise<void> {
    await this.loginService.loginImpersonate(user.id);

    this.toastService.toast("Přihlášen jako " + user.login);
    this.router.navigate(["/"]);
  }

  hasRole(name: string) {
    return this.roles.some((role) => role.name === name && role.active === true);
  }

  private getActions(user: UserResponse): Action[] {
    return [
      {
        text: "Upravit",
        icon: "create-outline",
        pinned: true,
        disabled: !user._links.updateUser.allowed,
        handler: () => this.router.navigate(["upravit"], { relativeTo: this.route }),
      },
      {
        text: "Přihlásit se jako " + user.login,
        icon: "log-in-outline",
        disabled: !user._links.impersonateUser.allowed,
        handler: () => this.impersonateUser(user),
      },
      {
        text: "Nastavit heslo",
        icon: "key-outline",
        disabled: !user._links.setUserPassword.allowed,
        handler: () => this.setPassword(),
      },
      {
        text: "Smazat uživatele",
        role: "destructive",
        color: "danger",
        icon: "trash-outline",
        disabled: !user._links.deleteUser.allowed,
        handler: () => this.deleteUser(),
      },
    ];
  }
}
