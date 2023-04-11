import { CommonModule } from "@angular/common";
import { NgModule } from "@angular/core";

import { SharedModule } from "src/app/shared/shared.module";

import { ProgramRoutingModule } from "./program-routing.module";

import { EventStatusLegendComponent } from "./components/event-status-legend/event-status-legend.component";
import { TrimesterSelectorComponent } from "./components/trimester-selector/trimester-selector.component";
import { ProgramCalendarComponent } from "./pages/program-calendar/program-calendar.component";
import { ProgramPlanningComponent } from "./pages/program-planning/program-planning.component";
import { ProgramPrintComponent } from "./pages/program-print/program-print.component";
import { ProgramWorkflowComponent } from "./pages/program-workflow/program-workflow.component";
import { ProgramComponent } from "./program.component";

@NgModule({
  imports: [CommonModule, ProgramRoutingModule, SharedModule],
  declarations: [
    ProgramPlanningComponent,
    ProgramWorkflowComponent,
    ProgramPrintComponent,
    TrimesterSelectorComponent,
    ProgramCalendarComponent,
    ProgramComponent,
    EventStatusLegendComponent,
  ],
})
export class ProgramModule {}
