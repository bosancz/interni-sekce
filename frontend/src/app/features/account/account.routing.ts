import { Routes } from "@angular/router";
import { AccountComponent } from "./pages/account.component";
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
		path: "chyby",
		title: "Nahlášené chyby",
		component: BugReportsComponent,
	},
];
