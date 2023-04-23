import { ChangeDetectionStrategy, Component, Input } from "@angular/core";
import { EventResponse } from "src/app/api";

@Component({
  selector: "bo-event-status-badge",
  templateUrl: "./event-status-badge.component.html",
  styleUrls: ["./event-status-badge.component.scss"],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EventStatusBadgeComponent {
  @Input() event!: EventResponse;

  constructor() {}
}
