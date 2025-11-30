import { NgModule } from "@angular/core";
import { RouterModule, Routes } from "@angular/router";
import { HomeMyEventsComponent } from "./pages/home-my-events/home-my-events.component";
import { HomeComponent } from "./pages/home/home.component";

const routes: Routes = [
	{ path: "", component: HomeComponent },
	{ path: "moje-akce", component: HomeMyEventsComponent },
];

@NgModule({
	imports: [RouterModule.forChild(routes)],
	exports: [RouterModule],
})
export class HomeRoutingModule {}
