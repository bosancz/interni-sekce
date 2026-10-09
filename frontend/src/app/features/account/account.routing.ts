import { Routes } from "@angular/router";
import { AccountComponent } from "./pages/account.component";
import { BadgesComponent } from "./pages/badges/badges.component";
import { BugReportsComponent } from "./pages/bug-reports/bug-reports.component";
import { NotificationSettingsComponent } from "./pages/notification-settings/notification-settings.component";
import { NotificationsComponent } from "./pages/notifications/notifications.component";

export const accountRoutes: Routes = [
	{
		path: "",
		component: AccountComponent,
	},
	{
		path: "notifikace",
		title: "Notifikace",
		component: NotificationsComponent,
	},
	{
		path: "notifikace/nastaveni",
		title: "Nastavení notifikací",
		component: NotificationSettingsComponent,
	},
	{
		path: "odznaky",
		title: "Odznaky",
		component: BadgesComponent,
	},
	{
		path: "chyby",
		title: "Nahlášené chyby",
		component: BugReportsComponent,
	},
];
