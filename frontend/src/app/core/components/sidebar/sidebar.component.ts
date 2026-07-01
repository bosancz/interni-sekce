import { Component } from "@angular/core";
import { RouterLink } from "@angular/router";
import { IonIcon, IonItem, IonLabel, IonList } from "@ionic/angular/standalone";
import { addIcons } from "ionicons";
import {
	calendarSharp,
	flameSharp,
	heartSharp,
	homeSharp,
	imagesSharp,
	logOut,
	peopleSharp,
	person,
	settings,
} from "ionicons/icons";
import { map } from "rxjs";
import { ApiService } from "src/app/core/services/api.service";
import { LoginService } from "src/app/core/services/login.service";
import { UserService } from "src/app/core/services/user.service";
import { DarkModeToggleComponent } from "src/app/shared/components/dark-mode-toggle/dark-mode-toggle.component";
import { VersionComponent } from "src/app/shared/components/version/version.component";

@Component({
	selector: "bo-sidebar",
	templateUrl: "./sidebar.component.html",
	styleUrl: "./sidebar.component.scss",
	imports: [RouterLink, IonList, IonItem, IonIcon, IonLabel, DarkModeToggleComponent, VersionComponent],
})
export class SidebarComponent {
	title = this.api.info.pipe(map((info) => "Bošán" + (info.environmentTitle ? ` ${info.environmentTitle}` : "")));

	canAccessAdmin = this.userService.canAccessAdmin;

	constructor(
		private readonly api: ApiService,
		private readonly loginService: LoginService,
		private readonly userService: UserService,
	) {
		addIcons({
			homeSharp,
			calendarSharp,
			heartSharp,
			flameSharp,
			imagesSharp,
			peopleSharp,
			person,
			settings,
			logOut,
		});
	}

	async logout() {
		await this.loginService.logout();
	}
}
