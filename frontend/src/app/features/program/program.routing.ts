import { Routes } from "@angular/router";

import { ProgramCalendarComponent } from "./pages/program-calendar/program-calendar.component";
import { ProgramPlanningComponent } from "./pages/program-planning/program-planning.component";
import { ProgramWorkflowComponent } from "./pages/program-workflow/program-workflow.component";
import { ProgramComponent } from "./program.component";

export const programRoutes: Routes = [
	{
		path: "",
		component: ProgramComponent,
		children: [
			{ path: "planovani", component: ProgramPlanningComponent },
			{ path: "kalendar", component: ProgramCalendarComponent },
			{ path: "schvalovani", component: ProgramWorkflowComponent },
			{ path: "", pathMatch: "full", redirectTo: "kalendar" },
		],
	},
];
