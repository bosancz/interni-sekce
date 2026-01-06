import { Component, OnInit } from "@angular/core";
import { toSignal } from "@angular/core/rxjs-interop";
import { IonApp, IonRouterOutlet, MenuController } from "@ionic/angular/standalone";
import { addIcons } from "ionicons";
import { calendarSharp, heartSharp, homeSharp } from "ionicons/icons";
import { LoginService } from "src/app/core/services/login.service";
import { UserService } from "src/app/core/services/user.service";
import { AppLoadingComponent } from "./core/components/app-loading/app-loading.component";
import { HeaderComponent } from "./core/components/header/header.component";
import { LoginComponent } from "./core/components/login/login.component";
import { SidebarComponent } from "./core/components/sidebar/sidebar.component";
import { ApiService } from "./core/services/api.service";
import { PlatformService } from "./core/services/platform.service";

@Component({
	selector: "bo-app",
	templateUrl: "./app.component.html",
	styleUrls: ["./app.component.scss"],

	imports: [IonApp, IonRouterOutlet, HeaderComponent, SidebarComponent, LoginComponent, AppLoadingComponent],
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
	) {
		addIcons({ homeSharp, calendarSharp, heartSharp });
	}

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
