import { Component, input, OnInit } from "@angular/core";
import { NavController } from "@ionic/angular";
import { IonBadge, IonIcon, IonLabel, IonTabBar, IonTabButton } from "@ionic/angular/standalone";
import { SDK } from "src/sdk";

@Component({
	selector: "bo-albums-tabs",
	templateUrl: "./albums-tabs.component.html",
	styleUrls: ["./albums-tabs.component.scss"],
	
	imports: [IonTabBar, IonTabButton, IonIcon, IonLabel, IonBadge],
})
export class AlbumsTabsComponent implements OnInit {
	album = input<SDK.AlbumResponseWithLinks | undefined>();
	selected = input<"info" | "fotky" | undefined>();

	constructor(private navController: NavController) {}

	ngOnInit(): void {}

	openTab(id: string) {
		const album = this.album();
		if (!album) return;

		const path = `/galerie/${album.id}/${id}`;

		this.navController.navigateForward(path, { animated: false, replaceUrl: true });
	}
}
