import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { PersonalAdminComponent } from "./personal-admin.component";

/* VIEWS */
import { MyDashboardComponent } from "./views/my-dashboard/my-dashboard.component";
import { CanalRegistrationComponent } from "./views/canal-registration/canal-registration.component";
import { DocumentsViewComponent } from "./views/documents-view/documents-view.component";

import { MyAccountComponent } from "./views/my-account/my-account.component";
import { MyAccountInfoComponent } from "./views/my-account/my-account-info/my-account-info.component";
import { MyAccountCredentialsComponent } from "./views/my-account/my-account-credentials/my-account-credentials.component";
import { MyAccountNotificationsComponent } from "./views/my-account/my-account-notifications/my-account-notifications.component";
import { MyAccountAppComponent } from "./views/my-account/my-account-app/my-account-app.component";

import { MyEventsComponent } from "./views/my-events/my-events.component";
import { EventComponent } from "./views/event/event.component";

import { MyGroupComponent } from './views/my-group/my-group.component';
import { MyGroupMembersComponent } from './views/my-group/my-group-members/my-group-members.component';

import { PaddlerCompetitionComponent } from './views/paddler-competition/paddler-competition.component';

import { AclGuard } from "lib/acl";


const routes:Routes = [
  {
    path: '',
    component: PersonalAdminComponent,
    canActivateChild: [AclGuard],
    children: [

      { path: 'prehled', component: MyDashboardComponent, data: { permission: "my:dashboard" } },

      { path: 'akce/:akce', component: EventComponent, data: { permission: "my:events" } },
      { path: 'akce', component: MyEventsComponent, data: { permission: "my:events" } },
      
      {
        path: 'oddil', component: MyGroupComponent, data: { permission: "my:group" },
        children: [
          { path: 'clenove', component: MyGroupMembersComponent },
          { path: '', redirectTo: "clenove", pathMatch: "full" }
        ]
      },

      { path: 'program', loadChildren: './views/program/program-admin.module#ProgramAdminModule' },
      
      { path: 'vodak-roku', component: PaddlerCompetitionComponent },
      
      { path: 'statistiky', loadChildren: './views/statistics/statistics.module#StatisticsModule' },

      { path: 'kanal', component: CanalRegistrationComponent },

      { path: 'dokumenty', component: DocumentsViewComponent },

      {
        path: 'ucet', component: MyAccountComponent, data: { permission: "my:account" },
        children: [
          { path: 'info', component: MyAccountInfoComponent },
          { path: 'notifikace', component: MyAccountNotificationsComponent },
          { path: 'prihlasovaci-udaje', component: MyAccountCredentialsComponent },
          { path: 'aplikace', component: MyAccountAppComponent },
          { path: '', redirectTo: "info", pathMatch: "full"}
        ]
      },

      { path: '', redirectTo: "prehled", pathMatch: "full"},

    ]
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class PersonalAdminRoutingModule { }
