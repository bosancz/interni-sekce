import { Component, EventEmitter, Input, Output } from "@angular/core";
import { UntilDestroy } from "@ngneat/until-destroy";

@UntilDestroy()
@Component({
	selector: "bo-event-info",
	templateUrl: "./event-info.component.html",
	styleUrls: ["./event-info.component.scss"],
	standalone: false,
})
export class EventInfoComponent {
	@Input() event?: BackendApiTypes.EventResponseWithLinks;
	@Output() update = new EventEmitter<BackendApiTypes.EventUpdateBody>();
}
