import { CommonModule } from "@angular/common";
import { Component, input } from "@angular/core";
import { IonItem, IonLabel, IonList } from "@ionic/angular/standalone";
import { BirthdayDuring } from "src/helpers/age";
import { SDK } from "src/sdk";

@Component({
	selector: "event-birthday-list",
	templateUrl: "./event-birthday-list.component.html",
	styleUrls: ["./event-birthday-list.component.scss"],

	imports: [CommonModule, IonList, IonItem, IonLabel],
})
export class EventBirthdayListComponent {
	birthdays = input.required<BirthdayDuring<SDK.MemberResponse>[]>();
}
