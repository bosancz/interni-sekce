import { Component, input, output } from "@angular/core";
import { CardFooterComponent } from "src/app/shared/components/card-footer/card-footer.component";
import { EventCardComponent } from "src/app/shared/components/event-card/event-card.component";
import { SDK } from "src/sdk";
import { ProgramEventAction } from "../../program-event-action";

@Component({
	selector: "bo-event-review-card",
	templateUrl: "./event-review-card.component.html",
	styleUrls: ["./event-review-card.component.scss"],
	imports: [EventCardComponent, CardFooterComponent],
})
export class EventReviewCardComponent {
	event = input.required<SDK.EventResponseWithLinks>();

	action = output<ProgramEventAction>();
}
