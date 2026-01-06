import { Component, OnInit } from "@angular/core";
import { toSignal } from "@angular/core/rxjs-interop";
import { MenuController } from "@ionic/angular";
import { IonApp, IonRouterOutlet } from "@ionic/angular/standalone";
import { LoginService } from "src/app/services/login.service";
import { UserService } from "src/app/services/user.service";
import { HeaderComponent } from "./components/header/header.component";
import { SidebarComponent } from "./components/sidebar/sidebar.component";
import { LoginComponent } from "./components/login/login.component";
import { AppLoadingComponent } from "./components/app-loading/app-loading.component";
import { ApiService } from "./services/api.service";
import { PlatformService } from "./services/platform.service";

@Component({
	selector: "bo-app",
	templateUrl: "./app.component.html",
	styleUrls: ["./app.component.scss"],
	standalone: true,
	imports: [
		IonApp,
		IonRouterOutlet,
		HeaderComponent,
		SidebarComponent,
		LoginComponent,
		AppLoadingComponent,
	],
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
