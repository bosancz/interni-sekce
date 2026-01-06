import { Routes } from "@angular/router";
import { EventViewComponent } from "./pages/event-view/event-view.component";
import { EventsListComponent } from "./pages/events-list/events-list.component";

export const eventsRoutes: Routes = [
	{ path: "", component: EventsListComponent },
	{ path: ":event", component: EventViewComponent },
];
