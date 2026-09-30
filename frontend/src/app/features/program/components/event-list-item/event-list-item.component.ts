import { Component, input, output } from "@angular/core";
import { RouterLink } from "@angular/router";
import { IonContent, IonIcon, IonItem, IonLabel, IonList, IonPopover } from "@ionic/angular/standalone";
import { addIcons } from "ionicons";
import { ellipsisHorizontal } from "ionicons/icons";
import { DateRangePipe } from "src/app/shared/pipes/date-range.pipe";
import { EventPipe } from "src/app/shared/pipes/event.pipe";
import { JoinLeadersPipe } from "src/app/shared/pipes/join-leaders.pipe";
import { SDK } from "src/sdk";
import { ProgramEventAction } from "../../program-event-action";

@Component({
	selector: "bo-event-list-item",
	templateUrl: "./event-list-item.component.html",
	styleUrls: ["./event-list-item.component.scss"],
	imports: [
		RouterLink,
		IonIcon,
		IonPopover,
		IonContent,
		IonList,
		IonItem,
		IonLabel,
		DateRangePipe,
		EventPipe,
		JoinLeadersPipe,
	],
})
export class EventListItemComponent {
	event = input.required<SDK.EventResponseWithLinks>();
	actions = input<"submit" | "menu" | "none">("none");

	action = output<ProgramEventAction>();

	constructor() {
		addIcons({ ellipsisHorizontal });
	}
}
