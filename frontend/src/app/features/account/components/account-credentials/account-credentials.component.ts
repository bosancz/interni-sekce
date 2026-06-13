import { Component } from "@angular/core";
import { toSignal } from "@angular/core/rxjs-interop";
import { IonItem, IonLabel, IonList, IonText } from "@ionic/angular/standalone";
import { ApiService } from "src/app/core/services/api.service";
import { ModalService } from "src/app/core/services/modal.service";
import { ToastService } from "src/app/core/services/toast.service";
import { UserService } from "src/app/core/services/user.service";

@Component({
	selector: "bo-account-credentials",
	templateUrl: "./account-credentials.component.html",
	styleUrls: ["./account-credentials.component.scss"],

	imports: [IonList, IonItem, IonLabel, IonText],
})
export class AccountCredentialsComponent {
	user = toSignal(this.userService.user);

	constructor(
		private api: ApiService,
		private userService: UserService,
		private toastService: ToastService,
		private modalService: ModalService,
	) {}

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
