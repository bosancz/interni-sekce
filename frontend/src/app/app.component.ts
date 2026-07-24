import { Component, OnInit, effect } from "@angular/core";
import { toSignal } from "@angular/core/rxjs-interop";
import { IonApp, IonRouterOutlet, MenuController } from "@ionic/angular/standalone";
import { addIcons } from "ionicons";
import { calendarSharp, downloadOutline, homeSharp } from "ionicons/icons";
import { LoginService } from "src/app/core/services/login.service";
import { UserService } from "src/app/core/services/user.service";
import { AppLoadingComponent } from "./core/components/app-loading/app-loading.component";
import { HeaderComponent } from "./core/components/header/header.component";
import { LoginComponent } from "./core/components/login/login.component";
import { SidebarComponent } from "./core/components/sidebar/sidebar.component";
import { ApiService } from "./core/services/api.service";
import { PlatformService } from "./core/services/platform.service";
import { PwaInstallService } from "./core/services/pwa-install.service";
import { ToastService } from "./core/services/toast.service";

@Component({
	selector: "bo-app",
	templateUrl: "./app.component.html",
	styleUrls: ["./app.component.scss"],

	imports: [IonApp, IonRouterOutlet, HeaderComponent, SidebarComponent, LoginComponent, AppLoadingComponent],
})
export class AppComponent implements OnInit {
	user = toSignal(this.userService.user);

	isLg = toSignal(this.platformService.isLg);

	private autoPromptShown = false;

	constructor(
		private userService: UserService,
		private loginService: LoginService,
		private menuController: MenuController,
		private api: ApiService,
		private readonly platformService: PlatformService,
		private readonly pwaInstall: PwaInstallService,
		private readonly toastService: ToastService,
	) {
		addIcons({ homeSharp, calendarSharp, downloadOutline });

		// Offer the native install prompt automatically once the browser reports the app is
		// installable and the user is logged in. Shown at most once per session.
		effect(() => {
			if (this.autoPromptShown) return;
			if (!this.user()) return;
			if (!this.pwaInstall.shouldAutoPrompt()) return;

			this.autoPromptShown = true;
			this.showInstallBanner();
		});
	}

	private async showInstallBanner() {
		const toast = await this.toastService.toast("Nainstalovat aplikaci na plochu tohoto zařízení?", {
			icon: downloadOutline,
			duration: 0,
			position: "bottom",
			buttons: [
				{
					text: "Nainstalovat",
					handler: () => {
						this.pwaInstall.install();
					},
				},
				{
					text: "Teď ne",
					role: "cancel",
				},
			],
		});

		// Snooze whenever the banner is dismissed without starting the install (the "Teď ne"
		// button or a swipe/backdrop dismiss both carry the "cancel" role).
		toast.onDidDismiss().then((event) => {
			if (event.role === "cancel") this.pwaInstall.snoozeAutoPrompt();
		});
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
