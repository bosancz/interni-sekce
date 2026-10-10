import { Routes } from "@angular/router";
import { GroupEditComponent } from "./pages/group-edit/group-edit.component";
import { GroupViewComponent } from "./pages/group-view/group-view.component";

export const groupsRoutes: Routes = [
	{ path: ":group/upravit", component: GroupEditComponent },
	{ path: ":group", component: GroupViewComponent },
	{ path: "", pathMatch: "full", redirectTo: "/databaze" },
];
