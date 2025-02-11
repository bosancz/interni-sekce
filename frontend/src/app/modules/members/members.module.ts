import { CommonModule } from "@angular/common";
import { NgModule } from "@angular/core";
import { SharedModule } from "src/app/shared/shared.module";
import { CardInsuranceCardComponent } from "./components/card-insurance-card/card-insurance-card.component";
import MemberContactsComponent from "./components/member-contacts/member-contacts.component";
import { MemberHealthComponent } from "./components/member-health/member-health.component";
import { MemberInfoComponent } from "./components/member-info/member-info.component";
import { MemberProfileComponent } from "./components/member-profile/member-profile.component";
import { MembersRoutingModule } from "./members-routing.module";
import { MembersCreateComponent } from "./pages/members-create/members-create.component";
import { MembersListComponent } from "./pages/members-list/members-list.component";
import { MembersViewComponent } from "./pages/members-view/members-view.component";
import { MemberContactComponent } from './components/member-contact/member-contact.component';
import { MemberAddressComponent } from './components/member-address/member-address.component';
import { MemberMembershipComponent } from './components/member-membership/member-membership.component';

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
  ],
  imports: [CommonModule, MembersRoutingModule, SharedModule],
})
export class MembersModule {}
