import { Component } from "@angular/core";
import { IsActiveMatchOptions, RouterLink, RouterLinkActive } from "@angular/router";
import { IonIcon, IonItem, IonLabel, IonList } from "@ionic/angular/standalone";
import { addIcons } from "ionicons";
import {
	bugOutline,
	globeOutline,
	homeSharp,
	logOut,
	notificationsOutline,
	openOutline,
	person,
	settings,
} from "ionicons/icons";
import { map } from "rxjs";
import { ApiService } from "src/app/core/services/api.service";
import { BugReportService } from "src/app/core/services/bug-report.service";
import { LoginService } from "src/app/core/services/login.service";
import { NotificationsService } from "src/app/core/services/notifications.service";
import { UserService } from "src/app/core/services/user.service";
import { DarkModeToggleComponent } from "src/app/shared/components/dark-mode-toggle/dark-mode-toggle.component";
import { UnreadBadgeComponent } from "src/app/shared/components/unread-badge/unread-badge.component";
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
		UnreadBadgeComponent,
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

	readonly exactPathLinkActiveOptions: IsActiveMatchOptions = {
		paths: "exact",
		queryParams: "ignored",
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

	unreadCount = this.notificationsService.unreadCount;

	constructor(
		private readonly api: ApiService,
		private readonly loginService: LoginService,
		private readonly userService: UserService,
		private readonly bugReportService: BugReportService,
		private readonly notificationsService: NotificationsService,
	) {
		addIcons({
			homeSharp,
			person,
			settings,
			logOut,
			bugOutline,
			notificationsOutline,
			globeOutline,
			openOutline,
		});
	}

	async logout() {
		await this.loginService.logout();
	}

	async reportBug() {
		return this.bugReportService.reportBug();
	}
}
