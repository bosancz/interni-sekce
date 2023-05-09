import { NgModule } from "@angular/core";
import { RouterModule, Routes } from "@angular/router";

import { EventsListComponent } from "./pages/events-list/events-list.component";

import { EventsComponent } from "./events.component";
import { EventEditComponent } from "./pages/event-edit/event-edit.component";
import { EventsCreateComponent } from "./pages/events-create/events-create.component";
import { EventsViewAccountingComponent } from "./pages/events-view-accounting/events-view-accounting.component";
import { EventsViewAttendeesComponent } from "./pages/events-view-attendees/events-view-attendees.component";
import { EventsViewInfoComponent } from "./pages/events-view-info/events-view-info.component";
import { EventsViewRegistrationComponent } from "./pages/events-view-registration/events-view-registration.component";
import { EventsViewReportComponent } from "./pages/events-view-report/events-view-report.component";

const routes: Routes = [
  { path: "", component: EventsListComponent },
  { path: "vytvorit", component: EventsCreateComponent },
  {
    path: ":event",
    component: EventsComponent,
    children: [
      { path: "upravit", component: EventEditComponent },
      { path: "info", component: EventsViewInfoComponent },
      { path: "ucastnici", component: EventsViewAttendeesComponent },
      { path: "prihlaska", component: EventsViewRegistrationComponent },
      { path: "uctovani", component: EventsViewAccountingComponent },
      { path: "report", component: EventsViewReportComponent },
      { path: "", redirectTo: "info", pathMatch: "full" },
    ],
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class EventsRoutingModule {}
