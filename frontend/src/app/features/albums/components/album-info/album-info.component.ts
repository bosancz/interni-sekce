import { DatePipe } from "@angular/common";
import { Component, input, output } from "@angular/core";
import { FormsModule } from "@angular/forms";
import { IonList } from "@ionic/angular/standalone";
import { addIcons } from "ionicons";
import { calendarOutline, textOutline } from "ionicons/icons";
import { EditButtonDateRangeComponent } from "src/app/shared/components/edit-button-date-range/edit-button-date-range.component";
import { EditButtonMarkdownComponent } from "src/app/shared/components/edit-button-markdown/edit-button-markdown.component";
import { EditButtonTextComponent } from "src/app/shared/components/edit-button-text/edit-button-text.component";
import { ItemComponent } from "src/app/shared/components/item/item.component";
import { DateRangePipe } from "src/app/shared/pipes/date-range.pipe";
import { MarkdownPipe } from "src/app/shared/pipes/markdown.pipe";
import { SDK } from "src/sdk";
import { EventSelectorComponent } from "../event-selector/event-selector.component";

@Component({
	selector: "bo-album-info",
	templateUrl: "./album-info.component.html",

	imports: [
		FormsModule,
		IonList,
		DatePipe,
		DateRangePipe,
		ItemComponent,
		EventSelectorComponent,
		EditButtonDateRangeComponent,
		EditButtonTextComponent,
		EditButtonMarkdownComponent,
		MarkdownPipe,
	],
})
export class AlbumInfoComponent {
	album = input<SDK.AlbumResponseWithLinks | undefined>(undefined);
	update = output<SDK.AlbumUpdateBody>();
	

	constructor() {
		addIcons({ calendarOutline, textOutline });
	}
}
