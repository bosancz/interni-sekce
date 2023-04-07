import { CommonModule } from "@angular/common";
import { NgModule } from "@angular/core";

import { SharedModule } from "src/app/shared/shared.module";

import { ProgramRoutingModule } from "./program-routing.module";

import { EventStatusLegendComponent } from "./components/event-status-legend/event-status-legend.component";
import { TrimesterSelectorComponent } from "./components/trimester-selector/trimester-selector.component";
import { ProgramComponent } from "./program.component";
import { ProgramCalendarComponent } from "./views/program-calendar/program-calendar.component";
import { ProgramPlanningComponent } from "./views/program-planning/program-planning.component";
import { ProgramPrintComponent } from "./views/program-print/program-print.component";
import { ProgramWorkflowComponent } from "./views/program-workflow/program-workflow.component";

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
