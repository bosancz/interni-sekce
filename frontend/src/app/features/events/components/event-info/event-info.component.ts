import { CommonModule } from "@angular/common";
import { Component, input, output } from "@angular/core";
import { FormsModule } from "@angular/forms";
import { IonList } from "@ionic/angular/standalone";
import { UntilDestroy } from "@ngneat/until-destroy";
import { EventTypeSelectorComponent } from "src/app/features/events/components/event-type-selector/event-type-selector.component";
import { CardContentComponent } from "src/app/shared/components/card-content/card-content.component";
import { CardComponent } from "src/app/shared/components/card/card.component";
import { EditButtonDateRangeComponent } from "src/app/shared/components/edit-button-date-range/edit-button-date-range.component";
import { EditButtonMarkdownComponent } from "src/app/shared/components/edit-button-markdown/edit-button-markdown.component";
import { EditButtonTextComponent } from "src/app/shared/components/edit-button-text/edit-button-text.component";
import { GroupsSelectComponent } from "src/app/shared/components/groups-select/groups-select.component";
import { ItemComponent } from "src/app/shared/components/item/item.component";
import { DateRangePipe } from "src/app/shared/pipes/date-range.pipe";
import { SDK } from "src/sdk";

@UntilDestroy()
@Component({
	selector: "bo-event-info",
	templateUrl: "./event-info.component.html",
	styleUrls: ["./event-info.component.scss"],

	imports: [
		CommonModule,
		FormsModule,
		IonList,
		ItemComponent,
		EditButtonTextComponent,
		EditButtonDateRangeComponent,
		EditButtonMarkdownComponent,
		GroupsSelectComponent,
		EventTypeSelectorComponent,
		CardComponent,
		CardContentComponent,
		DateRangePipe,
	],
})
export class EventInfoComponent {
	event = input<SDK.EventResponseWithLinks | undefined>(undefined);
	update = output<SDK.EventUpdateBody>();
}
