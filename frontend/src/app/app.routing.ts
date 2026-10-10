import { Routes } from "@angular/router";

import { NotFoundComponent } from "./core/pages/not-found/not-found.component";
import { roleGuard } from "./core/guards/role.guard";

export const appRoutes: Routes = [
	{
		path: "",
		title: "Přehled",
		loadChildren: () => import("./features/home/home.routing").then((m) => m.homeRoutes),
	},

	{
		path: "akce",
		title: "Akce",
		loadChildren: () => import("./features/events/events.routing").then((m) => m.eventsRoutes),
	},

	{
		path: "galerie",
		title: "Galerie",
		loadChildren: () => import("./features/albums/albums.routing").then((m) => m.albumsRoutes),
	},

	{
		path: "databaze",
		title: "Databáze",
		loadChildren: () => import("./features/members/members.routing").then((m) => m.membersRoutes),
	},

	{
		path: "oddily",
		title: "Oddíl",
		loadChildren: () => import("./features/groups/groups.routing").then((m) => m.groupsRoutes),
	},

	{
		path: "program",
		title: "Program",
		canMatch: [roleGuard("program")],
		loadChildren: () => import("./features/program/program.routing").then((m) => m.programRoutes),
	},

	{
		path: "prispevky",
		title: "Příspěvky",
		canMatch: [roleGuard("pokladnik")],
		loadChildren: () => import("./features/treasurer/treasurer.routing").then((m) => m.treasurerRoutes),
	},

	{
		path: "statistiky",
		title: "Statistiky",
		data: { permission: "statistics" },
		loadChildren: () => import("./features/statistics/statistics.routing").then((m) => m.statisticsRoutes),
	},

	{
		path: "ucet",
		title: "Účet",
		data: { permission: "account" },
		loadChildren: () => import("./features/account/account.routing").then((m) => m.accountRoutes),
	},

	{
		path: "admin",
		title: "Administrace",
		canMatch: [roleGuard("admin")],
		loadChildren: () => import("./features/admin/admin.routing").then((m) => m.adminRoutes),
	},

	{ path: "**", component: NotFoundComponent },
];
