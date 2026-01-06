import { Component } from "@angular/core";
import { HomeCardMyEventsComponent } from "../home-card-my-events/home-card-my-events.component";

@Component({
	selector: "bo-home-my",

	templateUrl: "./home-my.component.html",
	styleUrl: "./home-my.component.scss",
	imports: [HomeCardMyEventsComponent],
})
export class HomeMyComponent {}
