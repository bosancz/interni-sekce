import { ChangeDetectionStrategy, Component, input } from "@angular/core";
import { IonBadge, IonIcon } from "@ionic/angular/standalone";
import { addIcons } from "ionicons";
import { chatbubbleEllipsesOutline } from "ionicons/icons";
import { SDK } from "src/sdk";
import { TooltipDirective } from "../../directives/tooltip.directive";
import { EventStatusPipe } from "../../pipes/event-status.pipe";

@Component({
	selector: "bo-event-status-badge",
	templateUrl: "./event-status-badge.component.html",
	styleUrls: ["./event-status-badge.component.scss"],
	changeDetection: ChangeDetectionStrategy.OnPush,

	imports: [IonBadge, IonIcon, TooltipDirective, EventStatusPipe],
})
export class EventStatusBadgeComponent {
	event = input.required<SDK.EventResponseWithLinks>();

	constructor() {
		addIcons({ chatbubbleEllipsesOutline });
	}
}
