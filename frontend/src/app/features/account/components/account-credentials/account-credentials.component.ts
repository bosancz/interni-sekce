import { Component } from "@angular/core";
import { toSignal } from "@angular/core/rxjs-interop";
import { IonButton, IonIcon } from "@ionic/angular/standalone";
import { addIcons } from "ionicons";
import { createOutline, keyOutline } from "ionicons/icons";
import { ApiService } from "src/app/core/services/api.service";
import { ModalService } from "src/app/core/services/modal.service";
import { ToastService } from "src/app/core/services/toast.service";
import { UserService } from "src/app/core/services/user.service";
import { CardContentComponent } from "src/app/shared/components/card-content/card-content.component";
import { CardHeaderComponent } from "src/app/shared/components/card-header/card-header.component";
import { CardTitleComponent } from "src/app/shared/components/card-title/card-title.component";
import { CardComponent } from "src/app/shared/components/card/card.component";

@Component({
	selector: "bo-account-credentials",
	templateUrl: "./account-credentials.component.html",
	styleUrls: ["./account-credentials.component.scss"],

	imports: [
		IonButton,
		IonIcon,
		CardComponent,
		CardHeaderComponent,
		CardTitleComponent,
		CardContentComponent,
	],
})
export class AccountCredentialsComponent {
	user = toSignal(this.userService.user);

	constructor(
		private api: ApiService,
		private userService: UserService,
		private toastService: ToastService,
		private modalService: ModalService,
	) {
		addIcons({ keyOutline, createOutline });
	}

	async changeLogin() {
		const user = this.user();
		if (!user) return;

		const result = await this.modalService.inputModal<{ value: string }>({
			header: "Změnit login",
			inputs: {
				value: { placeholder: "Login: bilbo", type: "text", value: user.login },
			},
		});

		// login is NOT NULL + unique in the database, never send an empty value
		if (!result?.value) return;

		await this.api.UsersApi.updateUser(user.id, { login: result.value });

		this.toastService.toast("Uloženo.");

		await this.userService.loadUser();
	}

	async changePassword() {
		const user = this.user();
		if (!user) return;

		const result = await this.modalService.inputModal<{ value: string }>({
			header: "Změnit heslo",
			inputs: {
				value: { placeholder: "Nové heslo", type: "password" },
			},
		});

		// never send an empty password
		if (!result?.value) return;

		await this.api.UsersApi.setUserPassword(user.id, { password: result.value });

		this.toastService.toast("Uloženo.");

		await this.userService.loadUser();
	}
}
