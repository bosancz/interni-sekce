import { ChangeDetectionStrategy, Component, Input } from "@angular/core";
import { SDK } from "src/sdk";

@Component({
  selector: "bo-event-status-badge",
  templateUrl: "./event-status-badge.component.html",
  styleUrls: ["./event-status-badge.component.scss"],
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: false,
})
export class EventStatusBadgeComponent {
  @Input() event!: SDK.EventResponseWithLinks;

  constructor() {}
}
