import { Routes } from "@angular/router";

import { AdminHomeComponent } from "./pages/admin-home/admin-home.component";
import { FaceDetectionComponent } from "./pages/face-detection/face-detection.component";
import { FaceMatchingComponent } from "./pages/face-matching/face-matching.component";
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

	{ path: "obliceje", title: "Detekce obličejů", component: FaceDetectionComponent },
	{ path: "prirazovani-obliceju", title: "Přiřazování obličejů", component: FaceMatchingComponent },
	{ path: "workery", title: "Workery", component: WorkersComponent },
];
