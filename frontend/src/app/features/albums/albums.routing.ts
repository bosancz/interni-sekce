import { Routes } from "@angular/router";
import { AlbumsListComponent } from "./pages/albums-list/albums-list.component";
import { AlbumsViewInfoComponent } from "./pages/albums-view-info/albums-view-info.component";
import { DeletedAlbumsListComponent } from "./pages/deleted-albums-list/deleted-albums-list.component";
import { MemberNewPhotosComponent } from "./pages/member-new-photos/member-new-photos.component";
import { PhotosBrowseComponent } from "./pages/photos-browse/photos-browse.component";

export const albumsRoutes: Routes = [
	{ path: "smazane", component: DeletedAlbumsListComponent },

	{ path: "nove-fotky/:member/:notifiedAt", component: MemberNewPhotosComponent },

	{ path: "fotky", title: "Fotky", component: PhotosBrowseComponent },

	{ path: "kategorie", redirectTo: "fotky" },
	{ path: "kategorie/:category", redirectTo: ({ params }) => `/galerie/fotky?kategorie=${params["category"]}` },

	{ path: ":album", component: AlbumsViewInfoComponent },

	{ path: ":album/info", redirectTo: ":album" },

	{ path: "", component: AlbumsListComponent },
];
