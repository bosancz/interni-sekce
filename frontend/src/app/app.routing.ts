import { Routes } from "@angular/router";

import { NotFoundComponent } from "./core/pages/not-found/not-found.component";

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
		path: "program",
		title: "Program",
		data: { permission: "program" },
		loadChildren: () => import("./features/program/program.routing").then((m) => m.programRoutes),
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
		data: { permission: "admin" },
		loadChildren: () => import("./features/admin/admin.routing").then((m) => m.adminRoutes),
	},

	{ path: "**", component: NotFoundComponent },
];
