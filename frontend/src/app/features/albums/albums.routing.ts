import { Routes } from "@angular/router";
import { AlbumsEditComponent } from "./pages/albums-edit/albums-edit.component";
import { AlbumsListComponent } from "./pages/albums-list/albums-list.component";
import { AlbumsViewInfoComponent } from "./pages/albums-view-info/albums-view-info.component";
import { DeletedAlbumsListComponent } from "./pages/deleted-albums-list/deleted-albums-list.component";

export const albumsRoutes: Routes = [
	// must stay ahead of the `:album` routes, which would otherwise swallow it
	{ path: "smazane", component: DeletedAlbumsListComponent },

	{ path: ":album/upravit", component: AlbumsEditComponent },

	{ path: ":album/info", component: AlbumsViewInfoComponent },

	{ path: ":album", pathMatch: "full", redirectTo: ":album/info" },

	{ path: "", component: AlbumsListComponent },
];
