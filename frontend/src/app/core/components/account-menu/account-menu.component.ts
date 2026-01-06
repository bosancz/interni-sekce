import { Component } from "@angular/core";
import { IonIcon, IonItem, IonLabel, IonList, NavController, PopoverController } from "@ionic/angular/standalone";
import { LoginService } from "src/app/core/services/login.service";
import { UserService } from "src/app/core/services/user.service";

@Component({
	selector: "bo-account-menu",
	templateUrl: "./account-menu.component.html",
	styleUrl: "./account-menu.component.scss",
	imports: [IonList, IonItem, IonIcon, IonLabel],
})
export class AccountMenuComponent {
	user = this.userService.user;

	constructor(
		private readonly userService: UserService,
		private readonly loginService: LoginService,
		private readonly popoverController: PopoverController,
		private readonly navController: NavController,
	) {}

	async navigate(path: string) {
		await this.navController.navigateRoot([path]);
		this.close();
	}

	async logout() {
		await this.loginService.logout();
	}

	async close() {
		return this.popoverController.dismiss();
	}
}
