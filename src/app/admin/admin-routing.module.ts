import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

/* MAIN ADMIN COMPONENT */
import { AdminComponent } from "./admin.component";

/* ADMIN MODULES */
import { CampsAdminComponent } from './views/camps-admin/camps-admin.component';
import { CampAdminComponent } from './views/camps-admin/camp-admin/camp-admin.component';

import { DocumentsViewComponent } from './views/documents-view/documents-view.component';

import { EventsAdminComponent } from './views/events-admin/events-admin.component';
import { EventAdminComponent } from './views/events-admin/event-admin/event-admin.component';

import { GalleryAdminComponent } from './views/gallery-admin/gallery-admin.component';
import { AlbumsAdminComponent } from './views/gallery-admin/albums-admin/albums-admin.component';
import { AlbumAdminComponent } from './views/gallery-admin/album-admin/album-admin.component';

import { MembersAdminComponent } from './views/members-admin/members-admin.component';
import { MemberAdminComponent } from './views/members-admin/member-admin/member-admin.component';

import { MyAdminComponent } from './views/my-admin/my-admin.component';

import { UsersAdminComponent } from './views/users-admin/users-admin.component';
import { UserAdminComponent } from './views/users-admin/user-admin/user-admin.component';

import { WebAdminComponent } from './views/web-admin/web-admin.component';

const routes: Routes = [


  {
    path: '',
    component: AdminComponent,
    children: [
      {path: 'clenove/:member/:cat', component: MemberAdminComponent},
      {path: 'clenove/:member', redirectTo: "clenove/:member/osobni", pathMatch: "full"},
      {path: 'clenove', component: MembersAdminComponent},

      {path: 'dokumenty', component: DocumentsViewComponent},

      {path: 'akce/:event/:cat', component: EventAdminComponent},
      {path: 'akce/:event', redirectTo: "akce/:event/prehled", pathMatch: "full"},
      {path: 'akce', component: EventsAdminComponent},

      {path: 'galerie/:album/:cat', component: AlbumAdminComponent},
      {path: 'galerie/:album', redirectTo: "galerie/:album/prehled", pathMatch: "full"},
      {path: 'galerie', component: GalleryAdminComponent},

      {path: 'nastaveni-webu/:cat', component: WebAdminComponent},
      {path: 'nastaveni-webu', redirectTo: "nastaveni-webu/obecne", pathMatch: "full"},

      {path: 'tabory/:camp/:cat', component: CampAdminComponent},
      {path: 'tabory/:camp', redirectTo: "tabory/:camp/prehled", pathMatch: "full"},
      {path: 'tabory', component: CampsAdminComponent},

      {path: 'uzivatele/:user/:cat', component: UserAdminComponent},      
      {path: 'uzivatele/:user', redirectTo: "uzivatele/:user/info", pathMatch: "full"}, 
      {path: 'uzivatele', component: UsersAdminComponent},   
      
      {path: 'ucet/:cat', component: MyAdminComponent}, 
      {path: 'ucet', redirectTo: "ucet/info", pathMatch: "full"}, 

      {path: '', redirectTo: "akce", pathMatch: "full"},
    ]
  }

];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class AdminRoutingModule { }
