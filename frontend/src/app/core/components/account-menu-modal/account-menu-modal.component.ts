import { Component } from "@angular/core";
import { toSignal } from "@angular/core/rxjs-interop";
import { RouterLink } from "@angular/router";
import { IonIcon, IonItem, IonLabel, IonList, NavController, PopoverController } from "@ionic/angular/standalone";
import { addIcons } from "ionicons";
import { logOut, person, settings } from "ionicons/icons";
import { LoginService } from "src/app/core/services/login.service";
import { PlatformService } from "src/app/core/services/platform.service";
import { UserService } from "src/app/core/services/user.service";
import { DarkModeToggleComponent } from "src/app/shared/components/dark-mode-toggle/dark-mode-toggle.component";
import { VersionComponent } from "src/app/shared/components/version/version.component";

@Component({
	selector: "bo-account-menu-modal",
	templateUrl: "./account-menu-modal.component.html",
	styleUrl: "./account-menu-modal.component.scss",
	imports: [IonList, IonItem, IonIcon, IonLabel, RouterLink, DarkModeToggleComponent, VersionComponent],
})
export class AccountMenuModalComponent {
	user = this.userService.user;

	isLg = toSignal(this.platformService.isLg);

	constructor(
		private readonly platformService: PlatformService,
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
