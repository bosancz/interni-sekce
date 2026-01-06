import { NgModule } from "@angular/core";
import { RouterModule, Routes } from "@angular/router";

import { AdminHomeComponent } from "./pages/admin-home/admin-home.component";
import { UsersCreateComponent } from "./pages/users-create/users-create.component";
import { UsersEditComponent } from "./pages/users-edit/users-edit.component";
import { UsersListComponent } from "./pages/users-list/users-list.component";
import { UsersViewComponent } from "./pages/users-view/users-view.component";

const routes: Routes = [
	{ path: "", component: AdminHomeComponent },

	{ path: "uzivatele", component: UsersListComponent },
	{ path: "uzivatele/vytvorit", component: UsersCreateComponent },
	{ path: "uzivatele/:user", component: UsersViewComponent },
	{ path: "uzivatele/:user/upravit", component: UsersEditComponent },
];

@NgModule({
	imports: [RouterModule.forChild(routes)],
	exports: [RouterModule],
})
export class AdminRoutingModule {}
