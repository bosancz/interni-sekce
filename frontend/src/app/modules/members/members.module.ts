import { CommonModule } from "@angular/common";
import { NgModule } from "@angular/core";

import { SharedModule } from "src/app/shared/shared.module";

import { MembersRoutingModule } from "./members-routing.module";

import { MembersCreateComponent } from "./views/members-create/members-create.component";
import { MembersEditComponent } from "./views/members-edit/members-edit.component";
import { MembersListComponent } from "./views/members-list/members-list.component";
import { MembersViewComponent } from "./views/members-view/members-view.component";

@NgModule({
  declarations: [MembersListComponent, MembersViewComponent, MembersEditComponent, MembersCreateComponent],
  imports: [CommonModule, MembersRoutingModule, SharedModule],
})
export class MembersModule {}
