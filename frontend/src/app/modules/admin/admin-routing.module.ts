import { NgModule } from "@angular/core";
import { RouterModule, Routes } from "@angular/router";

import { UsersCreateComponent } from "./pages/users-create/users-create.component";
import { UsersEditComponent } from "./pages/users-edit/users-edit.component";
import { UsersListComponent } from "./pages/users-list/users-list.component";
import { UsersViewComponent } from "./pages/users-view/users-view.component";

const routes: Routes = [
	{ path: "vytvorit", component: UsersCreateComponent },

	{ path: ":user/upravit", component: UsersEditComponent },
	{ path: ":user", component: UsersViewComponent },

	{ path: "", component: UsersListComponent },
];

@NgModule({
	imports: [RouterModule.forChild(routes)],
	exports: [RouterModule],
})
export class AdminRoutingModule {}
