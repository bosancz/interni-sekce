import { CommonModule } from "@angular/common";
import { NgModule } from "@angular/core";
import { SharedModule } from "src/app/shared/shared.module";
import { MemberContactsComponent } from "./components/member-contacts/member-contacts.component";
import { MemberHealthComponent } from "./components/member-health/member-health.component";
import { MemberInfoComponent } from "./components/member-info/member-info.component";
import { MembersRoutingModule } from "./members-routing.module";
import { MembersCreateComponent } from "./pages/members-create/members-create.component";
import { MembersEditComponent } from "./pages/members-edit/members-edit.component";
import { MembersListComponent } from "./pages/members-list/members-list.component";
import { MembersViewComponent } from "./pages/members-view/members-view.component";

@NgModule({
  declarations: [
    MembersListComponent,
    MembersViewComponent,
    MembersEditComponent,
    MembersCreateComponent,
    MemberInfoComponent,
    MemberHealthComponent,
    MemberContactsComponent,
  ],
  imports: [CommonModule, MembersRoutingModule, SharedModule],
})
export class MembersModule {}
