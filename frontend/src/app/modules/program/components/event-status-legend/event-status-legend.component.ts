import { Component, OnInit } from "@angular/core";
import { KeyValuePipe } from "@angular/common";
import { IonList, IonItem, IonLabel } from "@ionic/angular/standalone";
import { EventStatuses } from "src/app/config/event-statuses";
import { DotComponent } from "src/app/shared/components/dot/dot.component";

@Component({
	selector: "bo-event-status-legend",
	templateUrl: "./event-status-legend.component.html",
	styleUrls: ["./event-status-legend.component.scss"],
	standalone: true,
	imports: [KeyValuePipe, IonList, IonItem, IonLabel, DotComponent],
})
export class EventStatusLegendComponent implements OnInit {
	statuses = EventStatuses;

	constructor() {}

	ngOnInit(): void {}
}
