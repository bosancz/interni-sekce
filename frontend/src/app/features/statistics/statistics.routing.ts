import { Routes } from "@angular/router";

import { StatisticsComponent } from "./statistics.component";

import { EventsDashboardComponent } from "./pages/events-dashboard/events-dashboard.component";
import { MembersDashboardComponent } from "./pages/members-dashboard/members-dashboard.component";
import { PaddlerCompetitionComponent } from "./pages/paddler-competition/paddler-competition.component";

export const statisticsRoutes: Routes = [
	{
		path: "",
		component: StatisticsComponent,
		children: [
			{ path: "akce", component: EventsDashboardComponent },

			{ path: "clenove", component: MembersDashboardComponent },

			{ path: "kilometry", component: PaddlerCompetitionComponent },

			{ path: "", redirectTo: "akce", pathMatch: "full" },
		],
	},
];
