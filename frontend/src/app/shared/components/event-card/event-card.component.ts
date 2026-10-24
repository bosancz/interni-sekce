import { Component, computed, input } from "@angular/core";
import { RouterLink } from "@angular/router";
import { IonIcon } from "@ionic/angular/standalone";
import { addIcons } from "ionicons";
import { chevronForward } from "ionicons/icons";
import { fixTypography } from "src/helpers/typography";
import { SDK } from "src/sdk";
import { DateRangePipe } from "../../pipes/date-range.pipe";
import { EventStatusPipe } from "../../pipes/event-status.pipe";
import { EventPipe } from "../../pipes/event.pipe";
import { GroupPipe } from "../../pipes/group.pipe";
import { MarkdownInlinePipe, MarkdownPipe } from "../../pipes/markdown.pipe";
import { MemberProfilePhotoUrlPipe } from "../../pipes/member-profile-photo-url.pipe";
import { MemberPipe } from "../../pipes/member.pipe";
import { TypographyPipe } from "../../pipes/typography.pipe";
import { CardContentComponent } from "../card-content/card-content.component";
import { CardStatusBarComponent } from "../card-status-bar/card-status-bar.component";
import { CardComponent } from "../card/card.component";

@Component({
	selector: "bo-event-card",
	templateUrl: "./event-card.component.html",
	styleUrls: ["./event-card.component.scss"],

	imports: [
		RouterLink,
		IonIcon,
		EventPipe,
		EventStatusPipe,
		GroupPipe,
		MemberPipe,
		MemberProfilePhotoUrlPipe,
		MarkdownPipe,
		MarkdownInlinePipe,
		TypographyPipe,
		CardComponent,
		CardContentComponent,
		CardStatusBarComponent,
	],
})
export class EventCardComponent {
	event = input.required<SDK.EventResponseWithLinks>();
	statusBar = input(true);
	link = input(false);

	subtitle = computed(() => {
		const event = this.event();
		const date = event.dateFrom ? new DateRangePipe().transform([event.dateFrom, event.dateTill]) : "";
		return fixTypography([date, event.place].filter(Boolean).join(", "));
	});

	constructor() {
		addIcons({ chevronForward });
	}
}
