import { CommonModule } from "@angular/common";
import { Component, input, output } from "@angular/core";
import { FormsModule } from "@angular/forms";
import { IonLabel, IonList } from "@ionic/angular/standalone";
import { UntilDestroy } from "@ngneat/until-destroy";
import { SDK } from "src/sdk";

@UntilDestroy()
@Component({
	selector: "bo-event-info",
	templateUrl: "./event-info.component.html",
	styleUrls: ["./event-info.component.scss"],
	
	imports: [CommonModule, FormsModule, IonList, IonLabel],
})
export class EventInfoComponent {
	event = input<SDK.EventResponseWithLinks | undefined>(undefined);
	update = output<SDK.EventUpdateBody>();
}
