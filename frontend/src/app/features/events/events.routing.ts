import { Routes } from "@angular/router";
import { provideCharts, withDefaultRegisterables } from "ng2-charts";
import { CampsListComponent } from "./pages/camps-list/camps-list.component";
import { DeletedEventsListComponent } from "./pages/deleted-events-list/deleted-events-list.component";
import { EventViewComponent } from "./pages/event-view/event-view.component";
import { EventsListComponent } from "./pages/events-list/events-list.component";

export const eventsRoutes: Routes = [
	{ path: "", component: EventsListComponent },
	{ path: "smazane", component: DeletedEventsListComponent },
	{ path: "tabory", component: CampsListComponent },
	{ path: ":event", component: EventViewComponent, providers: [provideCharts(withDefaultRegisterables())] },
];
