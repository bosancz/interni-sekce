import { Component, Input } from "@angular/core";
import { UntilDestroy } from "@ngneat/until-destroy";
import { EventResponseWithLinks } from "src/app/api";

@UntilDestroy()
@Component({
  selector: "bo-event-report",
  templateUrl: "./event-report.component.html",
  styleUrls: ["./event-report.component.scss"],
})
export class EventReportComponent {
  @Input() event?: EventResponseWithLinks;
}
