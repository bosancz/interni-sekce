import { CommonModule } from "@angular/common";
import { NgModule } from "@angular/core";
import { SharedModule } from "src/app/shared/shared.module";
import { EventAccountingComponent } from "./components/event-accounting/event-accounting.component";
import { EventAddAttendeesComponent } from "./components/event-add-attendees/event-add-attendees.component";
import { EventAgeHistogramComponent } from "./components/event-age-histogram/event-age-histogram.component";
import { EventAttendeesListComponent } from "./components/event-attendees-list/event-attendees-list.component";
import { EventAttendeesComponent } from "./components/event-attendees/event-attendees.component";
import { EventBirthdayListComponent } from "./components/event-birthday-list/event-birthday-list.component";
import { EventExpenseModalComponent } from "./components/event-expense-modal/event-expense-modal.component";
import { EventExpensesChartComponent } from "./components/event-expenses-chart/event-expenses-chart.component";
import { EventInfoComponent } from "./components/event-info/event-info.component";
import { EventRegistrationComponent } from "./components/event-registration/event-registration.component";
import { EventReportComponent } from "./components/event-report/event-report.component";
import { EventTypeSelectorComponent } from "./components/event-type-selector/event-type-selector.component";
import { EventsCreateComponent } from "./components/events-create/events-create.component";
import { MemberSelectorModalComponent } from "./components/member-selector-modal/member-selector-modal.component";
import { MemberSelectorComponent } from "./components/member-selector/member-selector.component";
import { EventsRoutingModule } from "./events-routing.module";
import { EventViewComponent } from "./pages/event-view/event-view.component";
import { EventsListComponent } from "./pages/events-list/events-list.component";
import { EventsService } from "./services/events.service";

@NgModule({
  declarations: [
    EventAccountingComponent,
    EventAddAttendeesComponent,
    EventAgeHistogramComponent,
    EventAttendeesComponent,
    EventBirthdayListComponent,
    EventExpenseModalComponent,
    EventExpensesChartComponent,
    EventInfoComponent,
    EventRegistrationComponent,
    EventReportComponent,
    EventsCreateComponent,
    EventsListComponent,
    EventTypeSelectorComponent,
    EventViewComponent,
    MemberSelectorComponent,
    MemberSelectorModalComponent,
    EventAttendeesListComponent,
  ],
  imports: [CommonModule, EventsRoutingModule, SharedModule],
  providers: [EventsService],
})
export class EventsModule {}
