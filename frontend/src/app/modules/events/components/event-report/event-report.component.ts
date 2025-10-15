import { Component, Input } from "@angular/core";
import { UntilDestroy } from "@ngneat/until-destroy";

@UntilDestroy()
@Component({
	selector: "bo-event-report",
	templateUrl: "./event-report.component.html",
	styleUrls: ["./event-report.component.scss"],
	standalone: false,
})
export class EventReportComponent {
	@Input() event?: BackendApiTypes.EventResponseWithLinks;
}
