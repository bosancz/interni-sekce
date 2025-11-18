import { NgModule } from "@angular/core";
import { RouterModule, Routes } from "@angular/router";
import { HomeDashboardComponent } from "./pages/home-dashboard/home-dashboard.component";
import { HomeMyEventsComponent } from "./pages/home-my-events/home-my-events.component";

const routes: Routes = [
	{ path: "", component: HomeDashboardComponent },
	{ path: "moje-akce", component: HomeMyEventsComponent },
];

@NgModule({
	imports: [RouterModule.forChild(routes)],
	exports: [RouterModule],
})
export class HomeRoutingModule {}
