import { NgModule } from "@angular/core";
import { RouterModule, Routes } from "@angular/router";
import MemberContactsComponent from "./components/member-contacts/member-contacts.component";
import { MemberHealthComponent } from "./components/member-health/member-health.component";
import { MemberInfoComponent } from "./components/member-info/member-info.component";
import { MembersCreateComponent } from "./pages/members-create/members-create.component";
import { MembersEditComponent } from "./pages/members-edit/members-edit.component";
import { MembersListComponent } from "./pages/members-list/members-list.component";
import { MembersViewComponent } from "./pages/members-view/members-view.component";

const routes: Routes = [
  { path: "pridat", component: MembersCreateComponent },
  { path: ":member/upravit", component: MembersEditComponent },

  {
    path: ":member",
    component: MembersViewComponent,
    children: [
      { path: "info", component: MemberInfoComponent },
      { path: "zdravotni-udaje", component: MemberHealthComponent },
      { path: "kontakty", component: MemberContactsComponent },
      { path: "", redirectTo: "info", pathMatch: "full" },
    ],
  },

  { path: "", component: MembersListComponent },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class MembersRoutingModule {}
