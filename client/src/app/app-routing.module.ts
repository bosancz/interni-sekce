import { NgModule } from '@angular/core';
import { Routes, RouterModule, ExtraOptions } from '@angular/router';

/* VIEWS */
import { NotFoundComponent } from 'app/core/views/not-found/not-found.component';

/* SERVICES */
import { AclGuard } from "lib/acl";

const routes:Routes = [

  {path: 'interni', loadChildren: './admin/admin.module#AdminModule', canLoad: [AclGuard] },

  {path: '', loadChildren: './frontend/frontend.module#FrontendModule' },
    
  {path: '**', component: NotFoundComponent}

];

const extraOptions:ExtraOptions = {
  scrollPositionRestoration: "enabled",
  anchorScrolling: "enabled"
};

@NgModule({
  imports: [RouterModule.forRoot(routes, extraOptions)],
  exports: [RouterModule]
})
export class AppRoutingModule { }