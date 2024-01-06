import { Component } from "@angular/core";
import { ActivatedRoute, Params } from "@angular/router";
import { UntilDestroy, untilDestroyed } from "@ngneat/until-destroy";
import { UserResponseWithLinks } from "src/app/api";
import { ApiService } from "src/app/services/api.service";
import { Action } from "src/app/shared/components/action-buttons/action-buttons.component";

@UntilDestroy()
@Component({
  selector: "bo-users-view",
  templateUrl: "./users-view.component.html",
  styleUrl: "./users-view.component.scss",
})
export class UsersViewComponent {
  user?: UserResponseWithLinks;

  actions: Action[] = [];

  constructor(
    private route: ActivatedRoute,
    private api: ApiService,
  ) {}

  ngOnInit() {
    this.route.params.pipe(untilDestroyed(this)).subscribe((params: Params) => this.loadUser(parseInt(params["user"])));
  }

  private async loadUser(id: number) {
    this.user = await this.api.users.getUser(id).then((res) => res.data);
    this.setActions(this.user);
  }

  private impersonateUser(user: UserResponseWithLinks) {}

  private deleteUser(user: UserResponseWithLinks) {}

  private setActions(user: UserResponseWithLinks) {
    this.actions = [
      {
        text: "Přihlásit se jako",
        icon: "person-circle-outline",
        hidden: !user._links.impersonateUser.applicable,
        disabled: !user._links.impersonateUser.allowed,
        handler: () => this.impersonateUser(user),
      },
      {
        text: "Smazat",
        icon: "trash-outline",
        color: "danger",
        hidden: !user._links.deleteUser.applicable,
        disabled: !user._links.deleteUser.allowed,
        handler: () => this.deleteUser(user),
      },
    ];
  }
}
