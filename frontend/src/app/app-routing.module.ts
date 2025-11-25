import { NgModule } from "@angular/core";
import { RouterModule, Routes } from "@angular/router";

import { NotFoundComponent } from "./core/pages/not-found/not-found.component";

const routes: Routes = [
	{
		path: "",
		title: "Přehled",
		loadChildren: () => import("./modules/home/home.module").then((m) => m.DashboardModule),
	},

	{
		path: "akce",
		title: "Akce",
		loadChildren: () => import("./modules/events/events.module").then((m) => m.EventsModule),
	},

	{
		path: "galerie",
		title: "Galerie",
		loadChildren: () => import("./modules/albums/albums.module").then((m) => m.AlbumsModule),
	},

	{
		path: "databaze",
		title: "Databáze",
		loadChildren: () => import("./modules/members/members.module").then((m) => m.MembersModule),
	},

	{
		path: "program",
		title: "Program",
		data: { permission: "program" },
		loadChildren: () => import("./modules/program/program.module").then((m) => m.ProgramModule),
	},

	{
		path: "statistiky",
		title: "Statistiky",
		data: { permission: "statistics" },
		loadChildren: () => import("./modules/statistics/statistics.module").then((m) => m.StatisticsModule),
	},

	{
		path: "ucet",
		title: "Účet",
		data: { permission: "account" },
		loadChildren: () => import("./modules/account/account.module").then((m) => m.AccountModule),
	},

	{
		path: "admin",
		title: "Administrace",
		data: { permission: "admin" },
		loadChildren: () => import("./modules/admin/admin.module").then((m) => m.AdminModule),
	},

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
