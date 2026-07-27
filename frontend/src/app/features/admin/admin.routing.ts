import { Routes } from "@angular/router";

import { linkGuard } from "src/app/core/guards/link.guard";

import { AdminHomeComponent } from "./pages/admin-home/admin-home.component";
import { UsersCreateComponent } from "./pages/users-create/users-create.component";
import { UsersEditComponent } from "./pages/users-edit/users-edit.component";
import { UsersListComponent } from "./pages/users-list/users-list.component";
import { UsersViewComponent } from "./pages/users-view/users-view.component";

// The user-management pages are gated on the `listUsers` link so that someone who can reach `/admin`
// only for the program section cannot open them by typing the URL.
const canManageUsers = [linkGuard("listUsers")];

export const adminRoutes: Routes = [
	{ path: "", component: AdminHomeComponent },

	{ path: "uzivatele", component: UsersListComponent, canMatch: canManageUsers },
	{ path: "uzivatele/vytvorit", component: UsersCreateComponent, canMatch: canManageUsers },
	{ path: "uzivatele/:user", component: UsersViewComponent, canMatch: canManageUsers },
	{ path: "uzivatele/:user/upravit", component: UsersEditComponent, canMatch: canManageUsers },
];
