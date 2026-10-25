import { Component, input, output } from "@angular/core";
import { IonIcon } from "@ionic/angular/standalone";
import { addIcons } from "ionicons";
import { keyOutline } from "ionicons/icons";
import { AssignableUserRoles, getAssignedRoles, UserRoles } from "src/app/core/config/user-roles";
import { ModalService } from "src/app/core/services/modal.service";
import { CardContentComponent } from "src/app/shared/components/card-content/card-content.component";
import { CardHeaderComponent } from "src/app/shared/components/card-header/card-header.component";
import { CardTitleComponent } from "src/app/shared/components/card-title/card-title.component";
import { CardComponent } from "src/app/shared/components/card/card.component";
import { EditButtonComponent } from "src/app/shared/components/edit-button/edit-button.component";
import { UserRolesPipe } from "src/app/shared/pipes/user-roles.pipe";
import { SDK } from "src/sdk";
import { EditButtonTextComponent } from "../../../../shared/components/edit-button-text/edit-button-text.component";

@Component({
	selector: "bo-user-info",
	templateUrl: "./user-info.component.html",
	styleUrls: ["./user-info.component.scss"],
	imports: [
		UserRolesPipe,
		IonIcon,
		CardComponent,
		CardHeaderComponent,
		CardTitleComponent,
		CardContentComponent,
		EditButtonComponent,
		EditButtonTextComponent,
	],
})
export class UserInfoComponent {
	user = input<SDK.UserResponseWithLinks | null | undefined>();
	update = output<SDK.UserUpdateBody>();
	setPassword = output<string>();

	allRoles = UserRoles;

	constructor(private readonly modalService: ModalService) {
		addIcons({ keyOutline });
	}

	updateLogin(login: string | null) {
		if (login) this.update.emit({ login });
	}

	updateEmail(email: string | null) {
		if (email) this.update.emit({ email });
	}

	async editRoles() {
		const roles = await this.modalService.multiSelectModal<SDK.UserSavedRolesEnum>({
			header: "Role",
			values: Object.entries(AssignableUserRoles).map(([key, role]) => ({
				label: role.title,
				value: key as SDK.UserSavedRolesEnum,
			})),
			value: getAssignedRoles(this.user()?.roles),
		});

		if (roles) this.update.emit({ roles });
	}

	async changePassword() {
		const result = await this.modalService.inputModal<{ value: string }>({
			header: "Změnit heslo",
			inputs: {
				value: { placeholder: "Nové heslo", type: "password" },
			},
		});

		if (result?.value) this.setPassword.emit(result.value);
	}
}
