import { KeyValuePipe } from "@angular/common";
import { Component, input, output, ChangeDetectionStrategy } from "@angular/core";
import { IonButton, IonLabel, IonList, IonSelect, IonSelectOption } from "@ionic/angular/standalone";
import { ModalService } from "src/app/core/services/modal.service";
import { UserRoles } from "src/app/core/config/user-roles";
import { SDK } from "src/sdk";
import { EditButtonTextComponent } from "../../../../shared/components/edit-button-text/edit-button-text.component";
import { ItemComponent } from "../../../../shared/components/item/item.component";

@Component({
	selector: "bo-user-info",
	templateUrl: "./user-info.component.html",
	styleUrls: ["./user-info.component.scss"],
	imports: [
		IonList,
		IonLabel,
		IonButton,
		IonSelect,
		IonSelectOption,
		KeyValuePipe,
		ItemComponent,
		EditButtonTextComponent,
	],
})
export class UserInfoComponent {
	user = input<SDK.UserResponseWithLinks | null | undefined>();
	update = output<SDK.UserUpdateBody>();
	setPassword = output<string>();

	userRoles = UserRoles;

	constructor(private readonly modalService: ModalService) {}

	updateLogin(login: string | null) {
		if (login) this.update.emit({ login });
	}

	updateEmail(email: string | null) {
		if (email) this.update.emit({ email });
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
