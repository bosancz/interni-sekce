import { NgModule } from "@angular/core";
import { RouterModule, Routes } from "@angular/router";
import { GroupEditComponent } from "./pages/group-edit/group-edit.component";
import { GroupViewComponent } from "./pages/group-view/group-view.component";
import { GroupsCreateComponent } from "./pages/groups-create/groups-create.component";
import { GroupsListComponent } from "./pages/groups-list/groups-list.component";

const routes: Routes = [
  { path: "", component: GroupsListComponent },
  { path: "vytvorit", component: GroupsCreateComponent },
  { path: ":id/upravit", component: GroupEditComponent },
  { path: ":id", component: GroupViewComponent },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class GroupsRoutingModule {}
