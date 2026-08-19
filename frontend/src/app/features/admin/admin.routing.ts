import { Routes } from "@angular/router";

import { linkGuard } from "src/app/core/guards/link.guard";

import { AdminHomeComponent } from "./pages/admin-home/admin-home.component";
import { UsersCreateComponent } from "./pages/users-create/users-create.component";
import { UsersEditComponent } from "./pages/users-edit/users-edit.component";
import { UsersListComponent } from "./pages/users-list/users-list.component";
import { UsersViewComponent } from "./pages/users-view/users-view.component";

const canAccessUsers = [linkGuard("listUsers")];

export const adminRoutes: Routes = [
	{ path: "", component: AdminHomeComponent },

	{ path: "uzivatele", component: UsersListComponent, canMatch: canAccessUsers },
	{ path: "uzivatele/vytvorit", component: UsersCreateComponent, canMatch: canAccessUsers },
	{ path: "uzivatele/:user", component: UsersViewComponent, canMatch: canAccessUsers },
	{ path: "uzivatele/:user/upravit", component: UsersEditComponent, canMatch: canAccessUsers },
];
