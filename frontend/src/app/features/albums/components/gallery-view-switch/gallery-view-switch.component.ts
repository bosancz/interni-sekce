import { Component, input } from "@angular/core";
import { IonIcon, IonLabel, IonTabBar, IonTabButton, NavController } from "@ionic/angular/standalone";
import { addIcons } from "ionicons";
import { albumsOutline, imageOutline, pricetagsOutline } from "ionicons/icons";

export type GalleryView = "albums" | "categories" | "photos";

const GALLERY_VIEWS: { name: GalleryView; label: string; icon: string; url: string }[] = [
	{ name: "albums", label: "Alba", icon: "albums-outline", url: "/galerie" },
	{ name: "categories", label: "Kategorie", icon: "pricetags-outline", url: "/galerie/kategorie" },
	{ name: "photos", label: "Fotky", icon: "image-outline", url: "/galerie/fotky" },
];

@Component({
	selector: "bo-gallery-view-switch",
	templateUrl: "./gallery-view-switch.component.html",
	styleUrl: "./gallery-view-switch.component.scss",
	imports: [IonTabBar, IonTabButton, IonIcon, IonLabel],
})
export class GalleryViewSwitchComponent {
	active = input.required<GalleryView>();
	variant = input<"header" | "tabs">("header");

	views = GALLERY_VIEWS;

	constructor(private navController: NavController) {
		addIcons({ albumsOutline, imageOutline, pricetagsOutline });
	}

	open(view: (typeof GALLERY_VIEWS)[number]) {
		if (view.name === this.active()) return;
		this.navController.navigateRoot(view.url, { animated: false });
	}
}
