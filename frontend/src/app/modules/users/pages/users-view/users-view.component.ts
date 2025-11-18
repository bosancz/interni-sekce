import { Component } from "@angular/core";
import { ActivatedRoute, Params } from "@angular/router";
import { UntilDestroy, untilDestroyed } from "@ngneat/until-destroy";
import { ApiService } from "src/app/services/api.service";
import { Action } from "src/app/shared/components/action-buttons/action-buttons.component";
import { SDK } from "src/sdk";

@UntilDestroy()
@Component({
	selector: "bo-users-view",
	templateUrl: "./users-view.component.html",
	styleUrl: "./users-view.component.scss",
	standalone: false,
})
export class UsersViewComponent {
	user?: SDK.UserResponseWithLinks;

	actions: Action[] = [];

	constructor(
		private route: ActivatedRoute,
		private api: ApiService,
	) {}

	ngOnInit() {
		this.route.params
			.pipe(untilDestroyed(this))
			.subscribe((params: Params) => this.loadUser(parseInt(params["user"])));
	}

	private async loadUser(id: number) {
		this.user = await this.api.UsersApi.getUser(id).then((res) => res.data);
		this.setActions(this.user);
	}

	private impersonateUser(user: SDK.UserResponseWithLinks) {}

	private deleteUser(user: SDK.UserResponseWithLinks) {}

	private setActions(user: SDK.UserResponseWithLinks) {
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
