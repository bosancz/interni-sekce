import { NgModule } from "@angular/core";
import { RouterModule, Routes } from "@angular/router";
import { EventViewComponent } from "./pages/event-view/event-view.component";
import { EventsListComponent } from "./pages/events-list/events-list.component";

const routes: Routes = [
	{ path: "", component: EventsListComponent },
	{ path: ":event", component: EventViewComponent },
];

@NgModule({
	imports: [RouterModule.forChild(routes)],
	exports: [RouterModule],
})
export class EventsRoutingModule {}
