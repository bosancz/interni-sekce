import { CommonModule } from "@angular/common";
import { NgModule } from "@angular/core";

import { SharedModule } from "src/app/shared/shared.module";
import { GroupsRoutingModule } from "./groups-routing.module";
import { GroupEditComponent } from "./pages/group-edit/group-edit.component";
import { GroupViewComponent } from "./pages/group-view/group-view.component";
import { GroupsCreateComponent } from "./pages/groups-create/groups-create.component";
import { GroupsListComponent } from "./pages/groups-list/groups-list.component";
import { GroupInfoComponent } from "./components/group-info/group-info.component";
import { GroupMembersComponent } from "./components/group-members/group-members.component";

@NgModule({
	declarations: [
		GroupsListComponent,
		GroupsCreateComponent,
		GroupEditComponent,
		GroupViewComponent,
		GroupInfoComponent,
		GroupMembersComponent,
	],
	imports: [CommonModule, GroupsRoutingModule, SharedModule],
})
export class GroupsModule {}
