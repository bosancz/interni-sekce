import { Component } from "@angular/core";
import { toSignal } from "@angular/core/rxjs-interop";
import { RouterLink } from "@angular/router";
import { IonButtons, IonIcon } from "@ionic/angular/standalone";
import { addIcons } from "ionicons";
import { mailOutline, peopleOutline } from "ionicons/icons";
import { UserRoles } from "src/app/core/config/user-roles";
import { ApiService } from "src/app/core/services/api.service";
import { ModalService } from "src/app/core/services/modal.service";
import { ToastService } from "src/app/core/services/toast.service";
import { UserService } from "src/app/core/services/user.service";
import { AvatarComponent } from "src/app/shared/components/avatar/avatar.component";
import { CardContentComponent } from "src/app/shared/components/card-content/card-content.component";
import { CardHeaderComponent } from "src/app/shared/components/card-header/card-header.component";
import { CardOpenButtonComponent } from "src/app/shared/components/card-open-button/card-open-button.component";
import { CardTitleComponent } from "src/app/shared/components/card-title/card-title.component";
import { CardComponent } from "src/app/shared/components/card/card.component";
import { EditButtonComponent } from "src/app/shared/components/edit-button/edit-button.component";
import { EditButtonTextComponent } from "src/app/shared/components/edit-button-text/edit-button-text.component";
import { PageContentComponent } from "src/app/shared/components/page-content/page-content.component";
import { PageHeaderComponent } from "src/app/shared/components/page-header/page-header.component";
import { GroupPipe } from "src/app/shared/pipes/group.pipe";
import { MemberPipe } from "src/app/shared/pipes/member.pipe";
import { SDK } from "src/sdk";
import { AccountAppComponent } from "../components/account-app/account-app.component";
import { AccountCredentialsComponent } from "../components/account-credentials/account-credentials.component";

@Component({
	selector: "bo-account",
	templateUrl: "./account.component.html",
	styleUrls: ["./account.component.scss"],
	imports: [
		PageHeaderComponent,
		PageContentComponent,
		IonIcon,
		IonButtons,
		RouterLink,
		AvatarComponent,
		CardComponent,
		CardHeaderComponent,
		CardTitleComponent,
		CardContentComponent,
		CardOpenButtonComponent,
		AccountCredentialsComponent,
		AccountAppComponent,
		EditButtonComponent,
		EditButtonTextComponent,
		GroupPipe,
		MemberPipe,
	],
})
export class AccountComponent {
	user = toSignal(this.userService.user);

	roles = UserRoles;

	constructor(
		private userService: UserService,
		private api: ApiService,
		private modalService: ModalService,
		private toastService: ToastService,
	) {
		addIcons({ mailOutline, peopleOutline });
	}

	async updateAccount(data: SDK.UserUpdateBody) {
		const user = this.user();
		if (!user?._links.updateUser.allowed) return;

		await this.api.UsersApi.updateUser(user.id, data);

		this.toastService.toast("Uloženo.");

		await this.userService.loadUser();
	}

	async editRoles() {
		const user = this.user();
		if (!user?._links.updateUser.allowed) return;

		const roles = await this.modalService.multiSelectModal<SDK.UserUpdateBodyRolesEnum>({
			header: "Role",
			values: Object.entries(this.roles).map(([value, role]) => ({
				label: role.title,
				value: value as SDK.UserUpdateBodyRolesEnum,
			})),
			value: (user.roles ?? []) as SDK.UserUpdateBodyRolesEnum[],
		});

		if (!roles) return;

		await this.updateAccount({ roles });
	}
}
