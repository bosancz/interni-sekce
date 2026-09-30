import { Component, computed, input, output } from "@angular/core";
import { RouterLink } from "@angular/router";
import { IonIcon } from "@ionic/angular/standalone";
import { addIcons } from "ionicons";
import { chevronForward } from "ionicons/icons";
import { CardContentComponent } from "src/app/shared/components/card-content/card-content.component";
import { CardFooterComponent } from "src/app/shared/components/card-footer/card-footer.component";
import { CardComponent } from "src/app/shared/components/card/card.component";
import { DateRangePipe } from "src/app/shared/pipes/date-range.pipe";
import { EventPipe } from "src/app/shared/pipes/event.pipe";
import { JoinLeadersPipe } from "src/app/shared/pipes/join-leaders.pipe";
import { MarkdownPipe } from "src/app/shared/pipes/markdown.pipe";
import { SDK } from "src/sdk";
import { ProgramEventAction } from "../../program-event-action";

@Component({
	selector: "bo-event-review-card",
	templateUrl: "./event-review-card.component.html",
	styleUrls: ["./event-review-card.component.scss"],
	imports: [
		RouterLink,
		IonIcon,
		CardComponent,
		CardContentComponent,
		CardFooterComponent,
		EventPipe,
		JoinLeadersPipe,
		MarkdownPipe,
	],
})
export class EventReviewCardComponent {
	event = input.required<SDK.EventResponseWithLinks>();

	action = output<ProgramEventAction>();

	subtitle = computed(() => {
		const event = this.event();
		const date = event.dateFrom ? new DateRangePipe().transform([event.dateFrom, event.dateTill]) : "";
		return [date, event.place].filter(Boolean).join(", ");
	});

	constructor() {
		addIcons({ chevronForward });
	}
}
