import { Component, EventEmitter, Input, Output } from "@angular/core";
import { UntilDestroy } from "@ngneat/until-destroy";
import { SDK } from "src/sdk";

@UntilDestroy()
@Component({
  selector: "bo-event-report",
  templateUrl: "./event-report.component.html",
  styleUrls: ["./event-report.component.scss"],
  standalone: false,
})
export class EventReportComponent {
  @Input() event?: SDK.EventResponseWithLinks;
  @Output() update = new EventEmitter<SDK.EventUpdateBody>();
}
