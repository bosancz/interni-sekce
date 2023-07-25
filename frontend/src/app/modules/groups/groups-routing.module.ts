import { NgModule } from "@angular/core";
import { RouterModule, Routes } from "@angular/router";
import { GroupsCreateComponent } from "./pages/groups-create/groups-create.component";
import { GroupsEditComponent } from "./pages/groups-edit/groups-edit.component";
import { GroupsListComponent } from "./pages/groups-list/groups-list.component";

const routes: Routes = [
  { path: "", component: GroupsListComponent },
  { path: "vytvorit", component: GroupsCreateComponent },
  { path: ":id/upravit", component: GroupsEditComponent },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class GroupsRoutingModule {}
