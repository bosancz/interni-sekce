import { NgModule } from "@angular/core";
import { RouterModule, Routes } from "@angular/router";

import { NotFoundComponent } from "./core/pages/not-found/not-found.component";

const routes: Routes = [
  {
    path: "",
    loadChildren: () => import("./modules/home/home.module").then((m) => m.DashboardModule),
  },

  {
    path: "akce",
    loadChildren: () => import("./modules/events/events.module").then((m) => m.EventsModule),
  },

  {
    path: "galerie",
    loadChildren: () => import("./modules/albums/albums.module").then((m) => m.AlbumsModule),
  },

  {
    path: "databaze",
    loadChildren: () => import("./modules/members/members.module").then((m) => m.MembersModule),
  },

  {
    path: "oddily",
    loadChildren: () => import("./modules/groups/groups.module").then((m) => m.GroupsModule),
  },

  {
    path: "program",
    data: { permission: "program" },
    loadChildren: () => import("./modules/program/program.module").then((m) => m.ProgramModule),
  },

  {
    path: "statistiky",
    data: { permission: "statistics" },
    loadChildren: () => import("./modules/statistics/statistics.module").then((m) => m.StatisticsModule),
  },

  {
    path: "ucet",
    data: { permission: "account" },
    loadChildren: () => import("./modules/account/account.module").then((m) => m.AccountModule),
  },

  {
    path: "uzivatele",
    data: { permission: "users" },
    loadChildren: () => import("./modules/users/users.module").then((m) => m.UsersModule),
  },

  // { path: '', redirectTo: "prehled", pathMatch: "full" },

  { path: "**", component: NotFoundComponent },
];

@NgModule({
  imports: [
    RouterModule.forRoot(routes, {
      paramsInheritanceStrategy: "always",
      anchorScrolling: "enabled",
    }),
  ],
  exports: [RouterModule],
})
export class AppRoutingModule {}
