import { CommonModule } from "@angular/common";
import { NgModule } from "@angular/core";
import { SharedModule } from "src/app/shared/shared.module";
import { EventAddAttendeesComponent } from "./components/event-add-attendees/event-add-attendees.component";
/* COMPONENTS */
import { EventAgeHistogramComponent } from "./components/event-age-histogram/event-age-histogram.component";
import { EventBirthdayListComponent } from "./components/event-birthday-list/event-birthday-list.component";
import { EventExpensesChartComponent } from "./components/event-expenses-chart/event-expenses-chart.component";
import { EventSubtypeSelectorComponent } from "./components/event-subtype-selector/event-subtype-selector.component";
import { MemberSelectorModalComponent } from "./components/member-selector-modal/member-selector-modal.component";
import { MemberSelectorComponent } from "./components/member-selector/member-selector.component";
import { EventsRoutingModule } from "./events-routing.module";
/* SERVICES */
import { EventsService } from "./services/events.service";
/* VIEWS */
import { EventExpenseModalComponent } from "./components/event-expense-modal/event-expense-modal.component";
import { EventEditComponent } from "./pages/event-edit/event-edit.component";
import { EventsCreateComponent } from "./pages/events-create/events-create.component";
import { EventsListComponent } from "./pages/events-list/events-list.component";
import { EventsViewAccountingComponent } from "./pages/events-view-accounting/events-view-accounting.component";
import { EventsViewAttendeesComponent } from "./pages/events-view-attendees/events-view-attendees.component";
import { EventsViewInfoComponent } from "./pages/events-view-info/events-view-info.component";
import { EventsViewRegistrationComponent } from "./pages/events-view-registration/events-view-registration.component";
import { EventsViewReportComponent } from "./pages/events-view-report/events-view-report.component";
import { EventsViewComponent } from "./pages/events-view/events-view.component";

@NgModule({
  declarations: [
    EventsListComponent,
    EventsViewComponent,
    EventEditComponent,
    EventsViewRegistrationComponent,
    EventAgeHistogramComponent,
    EventBirthdayListComponent,
    EventSubtypeSelectorComponent,
    EventExpensesChartComponent,
    EventsCreateComponent,
    EventsViewAttendeesComponent,
    EventsViewInfoComponent,
    EventsViewAccountingComponent,
    EventAddAttendeesComponent,
    MemberSelectorComponent,
    MemberSelectorModalComponent,
    EventExpenseModalComponent,
    EventsViewReportComponent,
  ],
  imports: [CommonModule, EventsRoutingModule, SharedModule],
  providers: [EventsService],
})
export class EventsModule {}
