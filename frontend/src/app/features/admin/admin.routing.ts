import { Routes } from "@angular/router";

import { AdminHomeComponent } from "./pages/admin-home/admin-home.component";
import { FaceDetectionComponent } from "./pages/face-detection/face-detection.component";
import { FaceMatchingComponent } from "./pages/face-matching/face-matching.component";
import { PhotoCategoriesComponent } from "./pages/photo-categories/photo-categories.component";
import { PhotoCategoryEditComponent } from "./pages/photo-category-edit/photo-category-edit.component";
import { PhotoContentComponent } from "./pages/photo-content/photo-content.component";
import { PhotosAdminComponent } from "./pages/photos-admin/photos-admin.component";
import { UsersCreateComponent } from "./pages/users-create/users-create.component";
import { UsersEditComponent } from "./pages/users-edit/users-edit.component";
import { UsersListComponent } from "./pages/users-list/users-list.component";
import { UsersViewComponent } from "./pages/users-view/users-view.component";
import { WorkersComponent } from "./pages/workers/workers.component";

export const adminRoutes: Routes = [
	{ path: "", component: AdminHomeComponent },

	{ path: "uzivatele", component: UsersListComponent },
	{ path: "uzivatele/vytvorit", component: UsersCreateComponent },
	{ path: "uzivatele/:user", component: UsersViewComponent },
	{ path: "uzivatele/:user/upravit", component: UsersEditComponent },

	{ path: "fotky/kategorie/:category", title: "Kategorie fotek", component: PhotoCategoryEditComponent },
	{
		path: "fotky",
		component: PhotosAdminComponent,
		children: [
			{ path: "obliceje", title: "Detekce obličejů", component: FaceDetectionComponent },
			{ path: "obsah", title: "Detekce obsahu", component: PhotoContentComponent },
			{ path: "prirazovani-obliceju", title: "Přiřazování obličejů", component: FaceMatchingComponent },
			{ path: "kategorie", title: "Kategorizace fotek", component: PhotoCategoriesComponent },
			{ path: "", redirectTo: "obliceje", pathMatch: "full" },
		],
	},
	{ path: "obliceje", redirectTo: "fotky/obliceje" },
	{ path: "prirazovani-obliceju", redirectTo: "fotky/prirazovani-obliceju" },
	{ path: "obsah-fotek", redirectTo: "fotky/obsah" },
	{ path: "workery", title: "Workery", component: WorkersComponent },
];
