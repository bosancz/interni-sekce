import { Component } from "@angular/core";
import { IsActiveMatchOptions, RouterLink, RouterLinkActive } from "@angular/router";
import { IonIcon, IonItem, IonLabel, IonList } from "@ionic/angular/standalone";
import { addIcons } from "ionicons";
import { clipboardOutline, homeSharp, peopleOutline, statsChartOutline, walletOutline } from "ionicons/icons";
import { map } from "rxjs";
import { AccountCardComponent } from "src/app/core/components/account-card/account-card.component";
import { ApiService } from "src/app/core/services/api.service";
import { UserService } from "src/app/core/services/user.service";
import { DarkModeToggleComponent } from "src/app/shared/components/dark-mode-toggle/dark-mode-toggle.component";
import { GroupPipe } from "src/app/shared/pipes/group.pipe";
import { VersionComponent } from "src/app/shared/components/version/version.component";

@Component({
	selector: "bo-sidebar",
	templateUrl: "./sidebar.component.html",
	styleUrl: "./sidebar.component.scss",
	imports: [
		RouterLink,
		RouterLinkActive,
		GroupPipe,
		IonList,
		IonItem,
		IonIcon,
		IonLabel,
		DarkModeToggleComponent,
		VersionComponent,
		AccountCardComponent,
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

	canAccessProgram = this.userService.canAccessProgram;
	canAccessTreasurer = this.userService.canAccessTreasurer;
	myGroupId = this.userService.myGroupId;

	constructor(
		private readonly api: ApiService,
		private readonly userService: UserService,
	) {
		addIcons({
			homeSharp,
			clipboardOutline,
			walletOutline,
			statsChartOutline,
			peopleOutline,
		});
	}
}
