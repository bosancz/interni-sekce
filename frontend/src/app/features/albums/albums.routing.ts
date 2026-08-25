import { Routes } from "@angular/router";
import { AlbumsListComponent } from "./pages/albums-list/albums-list.component";
import { AlbumsViewInfoComponent } from "./pages/albums-view-info/albums-view-info.component";
import { DeletedAlbumsListComponent } from "./pages/deleted-albums-list/deleted-albums-list.component";

export const albumsRoutes: Routes = [
	{ path: "smazane", component: DeletedAlbumsListComponent },

	{ path: ":album/info", component: AlbumsViewInfoComponent },

	{ path: ":album", pathMatch: "full", redirectTo: ":album/info" },

	{ path: "", component: AlbumsListComponent },
];
