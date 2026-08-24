import { Component, signal, viewChild } from "@angular/core";
import { toSignal } from "@angular/core/rxjs-interop";
import { RouterLink } from "@angular/router";
import { IonButton, IonButtons, IonIcon } from "@ionic/angular/standalone";
import { addIcons } from "ionicons";
import { searchSharp } from "ionicons/icons";
import { map } from "rxjs";
import { AccountMenuComponent } from "src/app/core/components/account-menu/account-menu.component";
import { GlobalSearchComponent } from "src/app/core/components/global-search/global-search.component";
import { ApiService } from "src/app/core/services/api.service";
import { PlatformService } from "src/app/core/services/platform.service";

@Component({
	selector: "bo-header",
	templateUrl: "./header.component.html",
	styleUrl: "./header.component.scss",
	imports: [RouterLink, IonButton, IonButtons, IonIcon, GlobalSearchComponent, AccountMenuComponent],
})
export class HeaderComponent {
	private static readonly BLUR_CLOSE_DELAY_MS = 200;

	showSearch = signal(false);

	private readonly globalSearch = viewChild(GlobalSearchComponent);

	isLg = toSignal(this.platformService.isLg);

	environment = toSignal(this.api.info.pipe(map((info) => info.environmentTitle || "")));

	constructor(
		private readonly api: ApiService,
		private readonly platformService: PlatformService,
	) {
		addIcons({ searchSharp });
	}

	onSearchBlur() {
		setTimeout(() => this.globalSearch()?.clear(), HeaderComponent.BLUR_CLOSE_DELAY_MS);
	}
}
