import { Component, computed } from "@angular/core";
import { toSignal } from "@angular/core/rxjs-interop";
import { NavigationEnd, Router, RouterLink, RouterOutlet } from "@angular/router";
import { IonButton, IonIcon, IonItem, IonLabel, IonList, IonTabBar, IonTabButton } from "@ionic/angular/standalone";
import { addIcons } from "ionicons";
import { addOutline, happyOutline, imagesOutline, peopleOutline, pricetagsOutline } from "ionicons/icons";
import { filter, map } from "rxjs";
import { ApiService } from "src/app/core/services/api.service";
import { PageContentComponent } from "src/app/shared/components/page-content/page-content.component";
import { PageFooterComponent } from "src/app/shared/components/page-footer/page-footer.component";
import { PageHeaderComponent } from "src/app/shared/components/page-header/page-header.component";
import { TooltipDirective } from "src/app/shared/directives/tooltip.directive";

const BASE_URL = "/admin/fotky";

@Component({
	selector: "bo-photos-admin",
	templateUrl: "./photos-admin.component.html",
	styleUrl: "./photos-admin.component.scss",
	imports: [
		PageHeaderComponent,
		PageContentComponent,
		PageFooterComponent,
		RouterOutlet,
		RouterLink,
		IonList,
		IonItem,
		IonTabBar,
		IonTabButton,
		IonLabel,
		IonButton,
		IonIcon,
		TooltipDirective,
	],
})
export class PhotosAdminComponent {
	readonly sections = [
		{ path: "obliceje", label: "Detekce obličejů", tabLabel: "Obličeje", icon: "happy-outline" },
		{ path: "obsah", label: "Detekce obsahu", tabLabel: "Obsah", icon: "images-outline" },
		{
			path: "prirazovani-obliceju",
			label: "Přiřazování obličejů",
			tabLabel: "Přiřazování",
			icon: "people-outline",
		},
		{ path: "kategorie", label: "Kategorizace fotek", tabLabel: "Kategorie", icon: "pricetags-outline" },
	];

	private url = toSignal(
		this.router.events.pipe(
			filter((event) => event instanceof NavigationEnd),
			map(() => this.router.url),
		),
		{ initialValue: this.router.url },
	);

	section = computed(
		() =>
			this.url()
				.split(/[?#]/)[0]
				.slice(BASE_URL.length + 1)
				.split("/")[0],
	);

	canCreateCategory = computed(() => this.api.links()?.createPhotoCategory.allowed ?? false);

	constructor(
		private router: Router,
		private api: ApiService,
	) {
		addIcons({ addOutline, happyOutline, imagesOutline, peopleOutline, pricetagsOutline });
	}
}
