import { Component } from "@angular/core";
import { NavController, PopoverController } from "@ionic/angular";
import { ApiService } from "src/app/services/api.service";
import { LoginService } from "src/app/services/login.service";
import { UserService } from "src/app/services/user.service";

@Component({
	selector: "bo-account-menu",
	standalone: false,
	templateUrl: "./account-menu.component.html",
	styleUrl: "./account-menu.component.scss",
})
export class AccountMenuComponent {
	user = this.userService.user;
	environment?: string;
	version?: string;

	constructor(
		private readonly userService: UserService,
		private readonly loginService: LoginService,
		private readonly api: ApiService,
		private readonly popoverController: PopoverController,
		private readonly navController: NavController,
	) {
		this.api.info.subscribe((info) => {
			this.environment = info.environmentTitle;
			this.version = info.version;
		});
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
