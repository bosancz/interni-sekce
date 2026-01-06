import { CommonModule } from "@angular/common";
import { Component, input, output } from "@angular/core";
import { UntilDestroy } from "@ngneat/until-destroy";
import { CardContentComponent } from "src/app/shared/components/card-content/card-content.component";
import { CardComponent } from "src/app/shared/components/card/card.component";
import { EditButtonMarkdownComponent } from "src/app/shared/components/edit-button-markdown/edit-button-markdown.component";
import { ItemComponent } from "src/app/shared/components/item/item.component";
import { SDK } from "src/sdk";

@UntilDestroy()
@Component({
	selector: "bo-event-report",
	templateUrl: "./event-report.component.html",
	styleUrls: ["./event-report.component.scss"],

	imports: [CommonModule, EditButtonMarkdownComponent, CardComponent, CardContentComponent, ItemComponent],
})
export class EventReportComponent {
	event = input<SDK.EventResponseWithLinks | undefined>();
	update = output<SDK.EventUpdateBody>();
}
