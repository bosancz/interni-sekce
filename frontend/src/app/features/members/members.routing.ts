import { inject } from "@angular/core";
import { CanActivateFn, Router, Routes } from "@angular/router";
import { GroupsService } from "src/app/core/services/groups.service";
import { GroupsDeletedComponent } from "./pages/groups-deleted/groups-deleted.component";
import { GroupsListComponent } from "./pages/groups-list/groups-list.component";
import { DeletedMembersListComponent } from "./pages/deleted-members-list/deleted-members-list.component";
import { MembersListComponent } from "./pages/members-list/members-list.component";
import { MembersViewComponent } from "./pages/members-view/members-view.component";

const redirectToGroup: CanActivateFn = async (route) => {
	const router = inject(Router);
	const group = await inject(GroupsService).getGroupById(Number(route.params["id"]));
	if (!group) return router.createUrlTree(["/databaze"]);
	return router.createUrlTree(["/oddily", group.shortName, ...route.url.slice(2).map((segment) => segment.path)], {
		queryParams: route.queryParams,
	});
};

export const membersRoutes: Routes = [
	{ path: "oddily/smazane", component: GroupsDeletedComponent },
	{ path: "oddily/:id/upravit", canActivate: [redirectToGroup], children: [] },
	{ path: "oddily/:id", canActivate: [redirectToGroup], children: [] },

	{ path: "clenove/smazane", component: DeletedMembersListComponent },
	{ path: "clenove/:member", component: MembersViewComponent },
	{ path: "clenove", component: MembersListComponent },

	{ path: "", component: GroupsListComponent },
];
