import { Routes } from "@angular/router";
import { GroupEditComponent } from "./pages/group-edit/group-edit.component";
import { GroupViewComponent } from "./pages/group-view/group-view.component";
import { GroupsDeletedComponent } from "./pages/groups-deleted/groups-deleted.component";
import { GroupsListComponent } from "./pages/groups-list/groups-list.component";
import { DeletedMembersListComponent } from "./pages/deleted-members-list/deleted-members-list.component";
import { MembersListComponent } from "./pages/members-list/members-list.component";
import { MembersViewComponent } from "./pages/members-view/members-view.component";

export const membersRoutes: Routes = [
	{ path: "oddily/smazane", component: GroupsDeletedComponent },
	{ path: "oddily/:id/upravit", component: GroupEditComponent },
	{ path: "oddily/:id", component: GroupViewComponent },

	{ path: "clenove/smazane", component: DeletedMembersListComponent },
	{ path: "clenove/:member", component: MembersViewComponent },
	{ path: "clenove", component: MembersListComponent },

	{ path: "", component: GroupsListComponent },
];
