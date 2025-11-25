import { NgModule } from "@angular/core";
import { RouterModule, Routes } from "@angular/router";
import { GroupInfoComponent } from "./components/group-info/group-info.component";
import { GroupMembersComponent } from "./components/group-members/group-members.component";
import { GroupEditComponent } from "./pages/group-edit/group-edit.component";
import { GroupViewComponent } from "./pages/group-view/group-view.component";
import { GroupsCreateComponent } from "./pages/groups-create/groups-create.component";
import { GroupsListComponent } from "./pages/groups-list/groups-list.component";
import { MembersCreateComponent } from "./pages/members-create/members-create.component";
import { MembersListComponent } from "./pages/members-list/members-list.component";
import { MembersViewComponent } from "./pages/members-view/members-view.component";

const routes: Routes = [
	{ path: "vytvorit", component: GroupsCreateComponent },

	{ path: "oddily/:id/upravit", component: GroupEditComponent },
	{
		path: "oddily/:id",
		component: GroupViewComponent,
		children: [
			{ path: "info", component: GroupInfoComponent },
			{ path: "clenove", component: GroupMembersComponent },
			{ path: "", redirectTo: "info", pathMatch: "full" },
		],
	},

	{ path: "clenove/pridat", component: MembersCreateComponent },

	{ path: "clenove/:member", component: MembersViewComponent },
	{ path: "clenove", component: MembersListComponent },

	{ path: "", component: GroupsListComponent },
];

@NgModule({
	imports: [RouterModule.forChild(routes)],
	exports: [RouterModule],
})
export class MembersRoutingModule {}
