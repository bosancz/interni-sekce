import { CommonModule } from "@angular/common";
import { Component, input, output } from "@angular/core";
import { IonSkeletonText } from "@ionic/angular/standalone";
import { UntilDestroy } from "@ngneat/until-destroy";
import { EditButtonMarkdownComponent } from "src/app/shared/components/edit-button-markdown/edit-button-markdown.component";
import { SDK } from "src/sdk";
import { MarkdownPipe } from "../../../../shared/pipes/markdown.pipe";

@UntilDestroy()
@Component({
	selector: "bo-event-report",
	templateUrl: "./event-report.component.html",
	styleUrls: ["./event-report.component.scss"],

	imports: [CommonModule, EditButtonMarkdownComponent, MarkdownPipe, IonSkeletonText],
})
export class EventReportComponent {
	event = input<SDK.EventResponseWithLinks | undefined>();
	update = output<SDK.EventUpdateBody>();
}
