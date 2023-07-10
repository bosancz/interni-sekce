import { CommonModule } from "@angular/common";
import { NgModule } from "@angular/core";

import { SharedModule } from "src/app/shared/shared.module";
import { GroupsRoutingModule } from "./groups-routing.module";
import { GroupsListComponent } from "./pages/groups-list/groups-list.component";
import { GroupsCreateComponent } from './pages/groups-create/groups-create.component';
import { GroupsEditComponent } from './pages/groups-edit/groups-edit.component';

@NgModule({
  declarations: [GroupsListComponent, GroupsCreateComponent, GroupsEditComponent],
  imports: [CommonModule, GroupsRoutingModule, SharedModule],
})
export class GroupsModule {}
