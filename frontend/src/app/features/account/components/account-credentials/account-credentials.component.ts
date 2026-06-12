import { Component } from "@angular/core";
import { toSignal } from "@angular/core/rxjs-interop";
import { AlertController, IonItem, IonLabel, IonList, IonText } from "@ionic/angular/standalone";
import { ApiService } from "src/app/core/services/api.service";
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
		private alertController: AlertController,
	) {}

	async updateCredentials(credentials: { login: string; password: string }) {
		const user = this.user();
		if (!user) return;

		await this.api.UsersApi.setUserPassword(user.id, credentials);

		this.toastService.toast("Uloženo.");

		await this.userService.loadUser();
	}

	async openChangeCredentials() {
		const alert = await this.alertController.create({
			header: "Změna hesla",
			inputs: [
				{
					name: "login",
					type: "text",
					placeholder: "Login: bilbo",
					value: this.user()?.login,
				},
				{
					name: "password",
					type: "password",
					placeholder: "Heslo: rekni_pritel_a_vejdi",
					attributes: {
						minlength: 8,
					},
				},
			],
			buttons: [
				{
					text: "Zrušit",
					role: "cancel",
					cssClass: "secondary",
				},
				{
					text: "Změnit",
					handler: (credentials) => this.updateCredentials(credentials),
				},
			],
		});

		await alert.present();
	}

	async saveCredentials() {}
}
