import { Component } from "@angular/core";
import { IsActiveMatchOptions, RouterLink, RouterLinkActive } from "@angular/router";
import { IonIcon, IonItem, IonLabel, IonList } from "@ionic/angular/standalone";
import { addIcons } from "ionicons";
import { bugOutline, homeSharp, logOut, person, settings } from "ionicons/icons";
import { map } from "rxjs";
import { ApiService } from "src/app/core/services/api.service";
import { LoginService } from "src/app/core/services/login.service";
import { ModalService } from "src/app/core/services/modal.service";
import { ToastService } from "src/app/core/services/toast.service";
import { UserService } from "src/app/core/services/user.service";
import { DarkModeToggleComponent } from "src/app/shared/components/dark-mode-toggle/dark-mode-toggle.component";
import { VersionComponent } from "src/app/shared/components/version/version.component";

@Component({
	selector: "bo-sidebar",
	templateUrl: "./sidebar.component.html",
	styleUrl: "./sidebar.component.scss",
	imports: [
		RouterLink,
		RouterLinkActive,
		IonList,
		IonItem,
		IonIcon,
		IonLabel,
		DarkModeToggleComponent,
		VersionComponent,
	],
})
export class SidebarComponent {
	title = this.api.info.pipe(map((info) => "Bošán" + (info.environmentTitle ? ` ${info.environmentTitle}` : "")));

	readonly tabLinkActiveOptions: IsActiveMatchOptions = {
		paths: "exact",
		queryParams: "exact",
		matrixParams: "ignored",
		fragment: "ignored",
	};

	readonly pathLinkActiveOptions: IsActiveMatchOptions = {
		paths: "subset",
		queryParams: "ignored",
		matrixParams: "ignored",
		fragment: "ignored",
	};

	canAccessAdmin = this.userService.canAccessAdmin;

	constructor(
		private readonly api: ApiService,
		private readonly loginService: LoginService,
		private readonly userService: UserService,
		private readonly modalService: ModalService,
		private readonly toastService: ToastService,
	) {
		addIcons({
			homeSharp,
			person,
			settings,
			logOut,
			bugOutline,
		});
	}

	async logout() {
		await this.loginService.logout();
	}

	async reportBug() {
		const url = window.location.href;

		const result = await this.modalService.wideInputModal<{ description: string }>({
			header: "Nahlásit chybu",
			buttonText: "Odeslat",
			inputs: {
				description: {
					type: "textarea",
					placeholder: "Popiš, co nefunguje..., ideálně co nejvíc detailně a s kroky, jak chybu vyvolat.",
				},
			},
		});

		const description = result?.description?.trim();
		if (!description) return;

		try {
			await this.api.FeedbackApi.sendBugReport({ description, url });
			await this.toastService.toast("Díky! Chyba byla odeslána.");
		} catch {
			await this.toastService.toast("Chybu se nepodařilo odeslat.");
		}
	}
}
