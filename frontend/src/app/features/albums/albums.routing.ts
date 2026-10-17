import { Routes } from "@angular/router";
import { AlbumsListComponent } from "./pages/albums-list/albums-list.component";
import { AlbumsViewInfoComponent } from "./pages/albums-view-info/albums-view-info.component";
import { DeletedAlbumsListComponent } from "./pages/deleted-albums-list/deleted-albums-list.component";
import { MemberNewPhotosComponent } from "./pages/member-new-photos/member-new-photos.component";
import { PhotoCategoriesListComponent } from "./pages/photo-categories-list/photo-categories-list.component";
import { PhotosBrowseComponent } from "./pages/photos-browse/photos-browse.component";

export const albumsRoutes: Routes = [
	{ path: "", pathMatch: "full", redirectTo: "alba" },

	{ path: "alba", title: "Alba", component: AlbumsListComponent },
	{ path: "alba/smazane", component: DeletedAlbumsListComponent },
	{ path: "alba/:album", component: AlbumsViewInfoComponent },
	{ path: "alba/:album/info", redirectTo: "alba/:album" },

	{ path: "smazane", redirectTo: "alba/smazane" },

	{ path: "nove-fotky/:member/:notifiedAt", component: MemberNewPhotosComponent },

	{ path: "fotky", title: "Fotky", component: PhotosBrowseComponent },

	{ path: "kategorie", title: "Kategorie fotek", component: PhotoCategoriesListComponent },
	{ path: "kategorie/:category", redirectTo: ({ params }) => `/galerie/fotky?kategorie=${params["category"]}` },

	{ path: ":album", redirectTo: "alba/:album" },
	{ path: ":album/info", redirectTo: "alba/:album" },
];
