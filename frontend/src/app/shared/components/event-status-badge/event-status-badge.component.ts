import { ChangeDetectionStrategy, Component, Input } from "@angular/core";

@Component({
	selector: "bo-event-status-badge",
	templateUrl: "./event-status-badge.component.html",
	styleUrls: ["./event-status-badge.component.scss"],
	changeDetection: ChangeDetectionStrategy.OnPush,
	standalone: false,
})
export class EventStatusBadgeComponent {
	@Input() event!: BackendApiTypes.EventResponseWithLinks;

	constructor() {}
}
