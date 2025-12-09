import { Component, OnInit } from "@angular/core";
import { toSignal } from "@angular/core/rxjs-interop";
import { MenuController } from "@ionic/angular";
import { LoginService } from "src/app/services/login.service";
import { UserService } from "src/app/services/user.service";
import { ApiService } from "./services/api.service";
import { PlatformService } from "./services/platform.service";

@Component({
	selector: "bo-app",
	templateUrl: "./app.component.html",
	styleUrls: ["./app.component.scss"],
	standalone: false,
})
export class AppComponent implements OnInit {
	user = toSignal(this.userService.user);

	isLg = toSignal(this.platformService.isLg);

	constructor(
		private userService: UserService,
		private loginService: LoginService,
		private menuController: MenuController,
		private api: ApiService,
		private readonly platformService: PlatformService,
	) {}

	ngOnInit() {
		this.userService.user.subscribe((user) => {
			if (user !== undefined) {
				this.api.reloadApi();
			}
		});

		this.loginService.onLogin.subscribe(() => {
			this.userService.loadUser();
		});
		this.loginService.onLogout.subscribe(() => {
			this.userService.clearUser();
		});
	}

	closeSidebar() {
		this.menuController.close();
	}
}
