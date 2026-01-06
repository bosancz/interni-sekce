import { CommonModule } from "@angular/common";
import { NgModule } from "@angular/core";
import { SharedModule } from "src/app/shared/shared.module";
import { CardInsuranceCardComponent } from "./components/card-insurance-card/card-insurance-card.component";
import { GroupInfoComponent } from "./components/group-info/group-info.component";
import { GroupMembersComponent } from "./components/group-members/group-members.component";
import { MemberAddressComponent } from "./components/member-address/member-address.component";
import { MemberContactComponent } from "./components/member-contact/member-contact.component";
import MemberContactsComponent from "./components/member-contacts/member-contacts.component";
import { MemberHealthComponent } from "./components/member-health/member-health.component";
import { MemberInfoComponent } from "./components/member-info/member-info.component";
import { MemberMembershipComponent } from "./components/member-membership/member-membership.component";
import { MemberProfileComponent } from "./components/member-profile/member-profile.component";
import { MembersRoutingModule } from "./members-routing.module";
import { GroupEditComponent } from "./pages/group-edit/group-edit.component";
import { GroupViewComponent } from "./pages/group-view/group-view.component";
import { GroupsCreateComponent } from "./pages/groups-create/groups-create.component";
import { GroupsListComponent } from "./pages/groups-list/groups-list.component";
import { MembersCreateComponent } from "./pages/members-create/members-create.component";
import { MembersListComponent } from "./pages/members-list/members-list.component";
import { MembersViewComponent } from "./pages/members-view/members-view.component";

@NgModule({
	declarations: [
		MembersListComponent,
		MembersViewComponent,
		MembersCreateComponent,
		MemberInfoComponent,
		MemberHealthComponent,
		MemberContactsComponent,
		CardInsuranceCardComponent,
		MemberProfileComponent,
		MemberContactComponent,
		MemberAddressComponent,
		MemberMembershipComponent,
		GroupsListComponent,
		GroupsCreateComponent,
		GroupEditComponent,
		GroupViewComponent,
		GroupInfoComponent,
		GroupMembersComponent,
	],
	imports: [CommonModule, MembersRoutingModule, SharedModule],
})
export class MembersModule {}
