import { DatePipe } from "@angular/common";
import { Component, signal } from "@angular/core";
import { ActivatedRoute, Params, RouterLink } from "@angular/router";
import { IonBadge, IonButton, IonButtons, IonIcon } from "@ionic/angular/standalone";
import { UntilDestroy, untilDestroyed } from "@ngneat/until-destroy";
import { addIcons } from "ionicons";
import { arrowForward } from "ionicons/icons";
import { ApiService } from "src/app/core/services/api.service";
import { Action } from "src/app/shared/components/action-buttons/action-buttons.component";
import { CardContentComponent } from "src/app/shared/components/card-content/card-content.component";
import { CardHeaderComponent } from "src/app/shared/components/card-header/card-header.component";
import { CardTitleComponent } from "src/app/shared/components/card-title/card-title.component";
import { CardComponent } from "src/app/shared/components/card/card.component";
import { EditButtonComponent } from "src/app/shared/components/edit-button/edit-button.component";
import { PageContentComponent } from "src/app/shared/components/page-content/page-content.component";
import { PageHeaderComponent } from "src/app/shared/components/page-header/page-header.component";
import { SDK } from "src/sdk";
import { UsersEditAccountComponent } from "../../components/users-edit-account/users-edit-account.component";

@UntilDestroy()
@Component({
	selector: "bo-users-view",
	templateUrl: "./users-view.component.html",
	styleUrl: "./users-view.component.scss",

	imports: [
		DatePipe,
		RouterLink,
		IonBadge,
		IonButton,
		IonButtons,
		IonIcon,
		PageHeaderComponent,
		PageContentComponent,
		CardComponent,
		CardHeaderComponent,
		CardTitleComponent,
		CardContentComponent,
		EditButtonComponent,
		UsersEditAccountComponent,
	],
})
export class UsersViewComponent {
	user = signal<SDK.UserResponseWithLinks | undefined>(undefined);

	actions = signal<Action[]>([]);

	constructor(
		private route: ActivatedRoute,
		private api: ApiService,
	) {
		addIcons({ arrowForward });
	}

	ngOnInit() {
		this.route.params
			.pipe(untilDestroyed(this))
			.subscribe((params: Params) => this.loadUser(parseInt(params["user"])));
	}

	private async loadUser(id: number) {
		const user = await this.api.UsersApi.getUser(id, { includeMember: true }).then((res) => res.data);
		this.user.set(user);
		this.setActions(user);
	}

	private impersonateUser(user: SDK.UserResponseWithLinks) {}

	private deleteUser(user: SDK.UserResponseWithLinks) {}

	private setActions(user: SDK.UserResponseWithLinks) {
		this.actions.set([
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
		]);
	}
}
