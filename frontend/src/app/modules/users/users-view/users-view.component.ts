import { Component, OnInit } from "@angular/core";
import { ActivatedRoute, Params, Router } from "@angular/router";
import { UntilDestroy, untilDestroyed } from "@ngneat/until-destroy";
import { UserRoles } from "src/app/config/user-roles";
import { User } from "src/app/schema/user";
import { UserRole } from "src/app/schema/user-role";
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
  user?: User;

  userRoles?: UserRole[];

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
  async loadUser(userId: string) {
    this.user = await this.api.get<User>(["user", userId]);
    this.userRoles = UserRoles.filter((item) => this.user?.roles.indexOf(item.id) !== -1);

    this.actions = this.getActions(this.user);
  }

  async setPassword() {
    if (!this.user) return;

    const password = window.prompt("Zadej nové heslo:");

    if (!password) return;

    await this.api.patch(["user", this.user._id], { password });

    this.toastService.toast("Heslo nastaveno.");
  }
  async deleteUser() {
    if (!this.user) return;

    const confirmation = window.confirm(`Opravdu smazat uživatele ${this.user.login}?`);

    if (!confirmation) return;

    await this.api.delete(["user", this.user._id]);

    this.toastService.toast(`Uživatel byl smazán.`);

    this.router.navigate(["../../"], { relativeTo: this.route });
  }

  async impersonateUser(user: User): Promise<void> {
    await this.loginService.loginImpersonate(user._id);

    this.toastService.toast("Přihlášen jako " + user.login);
    this.router.navigate(["/"]);
  }

  hasRole(name: string) {
    return this.roles.some((role) => role.name === name && role.active === true);
  }

  private getActions(user: User): Action[] {
    return [
      {
        text: "Upravit",
        icon: "create-outline",
        pinned: true,
        handler: () => this.router.navigate(["upravit"], { relativeTo: this.route }),
      },
      {
        text: "Přihlásit se jako " + user.login,
        icon: "log-in-outline",
        handler: () => this.impersonateUser(user),
      },
      {
        text: "Nastavit heslo",
        icon: "key-outline",
        handler: () => this.setPassword(),
      },
      {
        text: "Smazat uživatele",
        role: "destructive",
        color: "danger",
        icon: "trash-outline",
        disabled: !user._links.self.allowed.DELETE,
        handler: () => this.deleteUser(),
      },
    ];
  }
}
