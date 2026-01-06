import { KeyValuePipe } from "@angular/common";
import { Component, OnInit } from "@angular/core";
import { IonItem, IonLabel, IonList } from "@ionic/angular/standalone";
import { EventStatuses } from "src/app/core/config/event-statuses";
import { DotComponent } from "src/app/shared/components/dot/dot.component";

@Component({
	selector: "bo-event-status-legend",
	templateUrl: "./event-status-legend.component.html",
	styleUrls: ["./event-status-legend.component.scss"],
	
	imports: [KeyValuePipe, IonList, IonItem, IonLabel, DotComponent],
})
export class EventStatusLegendComponent implements OnInit {
	statuses = EventStatuses;

	constructor() {}

	ngOnInit(): void {}
}
