import { Routes } from "@angular/router";
import { AlbumsListComponent } from "./pages/albums-list/albums-list.component";
import { AlbumsViewInfoComponent } from "./pages/albums-view-info/albums-view-info.component";
import { DeletedAlbumsListComponent } from "./pages/deleted-albums-list/deleted-albums-list.component";
import { MemberNewPhotosComponent } from "./pages/member-new-photos/member-new-photos.component";
import { PhotoCategoriesListComponent } from "./pages/photo-categories-list/photo-categories-list.component";
import { PhotoCategoryViewComponent } from "./pages/photo-category-view/photo-category-view.component";

export const albumsRoutes: Routes = [
	{ path: "smazane", component: DeletedAlbumsListComponent },

	{ path: "nove-fotky/:member/:notifiedAt", component: MemberNewPhotosComponent },

	{ path: "kategorie", title: "Kategorie fotek", component: PhotoCategoriesListComponent },
	{ path: "kategorie/:category", title: "Kategorie fotek", component: PhotoCategoryViewComponent },

	{ path: ":album", component: AlbumsViewInfoComponent },

	{ path: ":album/info", redirectTo: ":album" },

	{ path: "", component: AlbumsListComponent },
];
