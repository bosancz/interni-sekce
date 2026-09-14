import { ChangeDetectionStrategy, Component, input } from "@angular/core";
import { IonBadge } from "@ionic/angular/standalone";
import { SDK } from "src/sdk";
import { EventStatusPipe } from "../../pipes/event-status.pipe";

@Component({
	selector: "bo-event-status-badge",
	templateUrl: "./event-status-badge.component.html",
	styleUrls: ["./event-status-badge.component.scss"],
	changeDetection: ChangeDetectionStrategy.OnPush,

	imports: [IonBadge, EventStatusPipe],
})
export class EventStatusBadgeComponent {
	event = input.required<SDK.EventResponseWithLinks>();

	constructor() {}
}
