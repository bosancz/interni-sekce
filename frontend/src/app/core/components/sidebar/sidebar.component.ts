import { Component } from "@angular/core";
import { IsActiveMatchOptions, RouterLink, RouterLinkActive } from "@angular/router";
import { IonIcon, IonItem, IonLabel, IonList } from "@ionic/angular/standalone";
import { addIcons } from "ionicons";
import { bugOutline, homeSharp, logOut, notificationsOutline, person, settings } from "ionicons/icons";
import { map } from "rxjs";
import { ApiService } from "src/app/core/services/api.service";
import { BugReportService } from "src/app/core/services/bug-report.service";
import { LoginService } from "src/app/core/services/login.service";
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
		private readonly bugReportService: BugReportService,
	) {
		addIcons({
			homeSharp,
			person,
			settings,
			logOut,
			bugOutline,
			notificationsOutline,
		});
	}

	async logout() {
		await this.loginService.logout();
	}

	async reportBug() {
		return this.bugReportService.reportBug();
	}
}
