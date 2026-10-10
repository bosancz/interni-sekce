import { Location } from "@angular/common";
import { Component, computed, DestroyRef, signal, viewChild } from "@angular/core";
import { toSignal } from "@angular/core/rxjs-interop";
import { RouterLink } from "@angular/router";
import { IonButton, IonButtons, IonIcon } from "@ionic/angular/standalone";
import { addIcons } from "ionicons";
import { arrowBackSharp, arrowForwardSharp, searchSharp } from "ionicons/icons";
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
	host: {
		"[class.lg]": "isLg()",
	},
})
export class HeaderComponent {
	private static readonly BLUR_CLOSE_DELAY_MS = 200;

	showSearch = signal(false);

	private readonly globalSearch = viewChild(GlobalSearchComponent);

	isLg = toSignal(this.platformService.isLg);

	isMobile = toSignal(this.platformService.isMobile);

	showHistoryNav = computed(() => this.platformService.isStandalone() && !this.isMobile());

	canGoBack = signal(true);
	canGoForward = signal(true);

	environment = toSignal(this.api.info.pipe(map((info) => info.environmentTitle || "")));

	constructor(
		private readonly api: ApiService,
		private readonly platformService: PlatformService,
		private readonly location: Location,
		destroyRef: DestroyRef,
	) {
		addIcons({ searchSharp, arrowBackSharp, arrowForwardSharp });

		const navigation = (window as unknown as { navigation?: HistoryNavigation }).navigation;
		if (navigation) {
			const update = () => {
				this.canGoBack.set(navigation.canGoBack);
				this.canGoForward.set(navigation.canGoForward);
			};
			update();
			navigation.addEventListener("currententrychange", update);
			destroyRef.onDestroy(() => navigation.removeEventListener("currententrychange", update));
		}
	}

	goBack() {
		this.location.back();
	}

	goForward() {
		this.location.forward();
	}

	onSearchBlur() {
		setTimeout(() => this.globalSearch()?.clear(), HeaderComponent.BLUR_CLOSE_DELAY_MS);
	}
}

interface HistoryNavigation extends EventTarget {
	readonly canGoBack: boolean;
	readonly canGoForward: boolean;
}
