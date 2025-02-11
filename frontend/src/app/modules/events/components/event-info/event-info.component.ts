import { Component, EventEmitter, Input, Output } from "@angular/core";
import { UntilDestroy } from "@ngneat/until-destroy";
import { SDK } from "src/sdk";

@UntilDestroy()
@Component({
	selector: "bo-event-info",
	templateUrl: "./event-info.component.html",
	styleUrls: ["./event-info.component.scss"],
	standalone: false,
})
export class EventInfoComponent {
	@Input() event?: SDK.EventResponseWithLinks;
	@Output() update = new EventEmitter<SDK.EventUpdateBody>();
}
