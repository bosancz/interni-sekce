import { Component } from "@angular/core";
import { RouterLink } from "@angular/router";
import { IonIcon, IonItem, IonLabel, IonList } from "@ionic/angular/standalone";
import { addIcons } from "ionicons";
import { calendarSharp, heartSharp, homeSharp } from "ionicons/icons";
import { map } from "rxjs";
import { ApiService } from "src/app/core/services/api.service";
import { DarkModeToggleComponent } from "src/app/shared/components/dark-mode-toggle/dark-mode-toggle.component";
import { VersionComponent } from "src/app/shared/components/version/version.component";
import { AccountMenuComponent } from "../account-menu/account-menu.component";

@Component({
	selector: "bo-sidebar",
	templateUrl: "./sidebar.component.html",
	styleUrl: "./sidebar.component.scss",
	imports: [
		RouterLink,
		IonList,
		IonItem,
		IonIcon,
		IonLabel,
		AccountMenuComponent,
		DarkModeToggleComponent,
		VersionComponent,
	],
})
export class SidebarComponent {
	title = this.api.info.pipe(map((info) => "Bošán" + (info.environmentTitle ? ` ${info.environmentTitle}` : "")));

	constructor(private readonly api: ApiService) {
		addIcons({ homeSharp, calendarSharp, heartSharp });
	}
}
