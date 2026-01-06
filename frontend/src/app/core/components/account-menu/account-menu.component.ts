import { Component } from "@angular/core";
import { RouterLink } from "@angular/router";
import { IonIcon, IonItem, IonLabel, IonList, NavController, PopoverController } from "@ionic/angular/standalone";
import { addIcons } from "ionicons";
import { logOut, person, settings } from "ionicons/icons";
import { LoginService } from "src/app/core/services/login.service";
import { UserService } from "src/app/core/services/user.service";

@Component({
	selector: "bo-account-menu",
	templateUrl: "./account-menu.component.html",
	styleUrl: "./account-menu.component.scss",
	imports: [IonList, IonItem, IonIcon, IonLabel, RouterLink],
})
export class AccountMenuComponent {
	user = this.userService.user;

	constructor(
		private readonly userService: UserService,
		private readonly loginService: LoginService,
		private readonly popoverController: PopoverController,
		private readonly navController: NavController,
	) {
		addIcons({ person, settings, logOut });
	}

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
