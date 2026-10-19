import { Routes } from "@angular/router";
import { GroupViewComponent } from "./pages/group-view/group-view.component";

export const groupsRoutes: Routes = [
	{ path: ":group/upravit", redirectTo: ":group" },
	{ path: ":group", component: GroupViewComponent },
	{ path: "", pathMatch: "full", redirectTo: "/databaze" },
];
