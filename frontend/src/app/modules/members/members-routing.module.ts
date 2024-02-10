import { NgModule } from "@angular/core";
import { RouterModule, Routes } from "@angular/router";
import { MembersCreateComponent } from "./pages/members-create/members-create.component";
import { MembersListComponent } from "./pages/members-list/members-list.component";
import { MembersViewComponent } from "./pages/members-view/members-view.component";

const routes: Routes = [
  { path: "pridat", component: MembersCreateComponent },

  { path: ":member", component: MembersViewComponent },

  { path: "", component: MembersListComponent },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class MembersRoutingModule {}
