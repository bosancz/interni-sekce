import { NgModule } from "@angular/core";
import { RouterModule, Routes } from "@angular/router";
import { GroupInfoComponent } from "./components/group-info/group-info.component";
import { GroupMembersComponent } from "./components/group-members/group-members.component";
import { GroupEditComponent } from "./pages/group-edit/group-edit.component";
import { GroupViewComponent } from "./pages/group-view/group-view.component";
import { GroupsCreateComponent } from "./pages/groups-create/groups-create.component";
import { GroupsListComponent } from "./pages/groups-list/groups-list.component";

const routes: Routes = [
  { path: "", component: GroupsListComponent },
  { path: "vytvorit", component: GroupsCreateComponent },
  { path: ":id/upravit", component: GroupEditComponent },
  {
    path: ":id",
    component: GroupViewComponent,
    children: [
      { path: "info", component: GroupInfoComponent },
      { path: "clenove", component: GroupMembersComponent },
      { path: "", redirectTo: "info", pathMatch: "full" },
    ],
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class GroupsRoutingModule {}
