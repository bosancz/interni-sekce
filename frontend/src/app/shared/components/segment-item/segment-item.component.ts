import { Component, input } from "@angular/core";
import { IonLabel, IonSegmentButton } from "@ionic/angular/standalone";

@Component({
	selector: "bo-segment-item",
	templateUrl: "./segment-item.component.html",
	imports: [IonSegmentButton, IonLabel],
})
export class SegmentItemComponent {
	name = input<string | undefined>();
	label = input<string | undefined>();
}
