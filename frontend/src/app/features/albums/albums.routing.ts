import { Routes } from "@angular/router";
import { AlbumsEditComponent } from "./pages/albums-edit/albums-edit.component";
import { AlbumsListComponent } from "./pages/albums-list/albums-list.component";
import { AlbumsViewInfoComponent } from "./pages/albums-view-info/albums-view-info.component";
import { AlbumsViewPhotosComponent } from "./pages/albums-view-photos/albums-view-photos.component";

export const albumsRoutes: Routes = [
	{ path: ":album/upravit", component: AlbumsEditComponent },

	{ path: ":album/info", component: AlbumsViewInfoComponent },
	{ path: ":album/fotky", component: AlbumsViewPhotosComponent },

	{ path: ":album", pathMatch: "full", redirectTo: ":album/info" },

	{ path: "", component: AlbumsListComponent },
];
