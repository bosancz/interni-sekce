import { NgModule } from "@angular/core";
import { RouterModule, Routes } from "@angular/router";

import { ProgramCalendarComponent } from "./pages/program-calendar/program-calendar.component";
import { ProgramPlanningComponent } from "./pages/program-planning/program-planning.component";
import { ProgramPrintComponent } from "./pages/program-print/program-print.component";
import { ProgramWorkflowComponent } from "./pages/program-workflow/program-workflow.component";
import { ProgramComponent } from "./program.component";

const routes: Routes = [
	{
		path: "",
		component: ProgramComponent,
		children: [
			{ path: "planovani", component: ProgramPlanningComponent },
			{ path: "tisk", component: ProgramPrintComponent },
			{ path: "kalendar", component: ProgramCalendarComponent },
			{ path: "schvalovani", component: ProgramWorkflowComponent },
			{ path: "", pathMatch: "full", redirectTo: "kalendar" },
		],
	},
];

@NgModule({
	imports: [RouterModule.forChild(routes)],
	exports: [RouterModule],
})
export class ProgramRoutingModule {}
