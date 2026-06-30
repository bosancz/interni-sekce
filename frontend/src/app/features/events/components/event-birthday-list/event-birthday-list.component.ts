import { CommonModule } from "@angular/common";
import { Component, effect, input } from "@angular/core";
import { IonItem, IonLabel, IonList } from "@ionic/angular/standalone";
import { DateTime } from "luxon";
import { SDK } from "src/sdk";

@Component({
	selector: "event-birthday-list",
	templateUrl: "./event-birthday-list.component.html",
	styleUrls: ["./event-birthday-list.component.scss"],

	imports: [CommonModule, IonList, IonItem, IonLabel],
})
export class EventBirthdayListComponent {
	event = input.required<SDK.EventResponseWithLinks>();
	members = input.required<SDK.MemberResponse[]>();
	birthdays: Array<{ age: number; date: string; member: SDK.MemberResponse }> = [];

	constructor() {
		effect(() => {
			const event = this.event();
			this.members();
			this.updateBirthdays(event);
		});
	}

	updateBirthdays(event: SDK.EventResponseWithLinks) {
		const members = this.members();

		this.birthdays = [];

		const dateFrom = DateTime.fromISO(event.dateFrom).set({ hour: 0, minute: 0 });
		const dateTill = DateTime.fromISO(event.dateTill).set({ hour: 23, minute: 59 });

		members.forEach((member) => {
			if (!member.birthday) return;
			var ageStart = Math.floor(-1 * DateTime.fromISO(member.birthday).diff(dateFrom, "years").toObject().years!);
			var ageEnd = Math.floor(-1 * DateTime.fromISO(member.birthday).diff(dateTill, "years").toObject().years!);
			if (ageStart < ageEnd) this.birthdays.push({ age: ageEnd, date: member.birthday, member: member });
		});
	}
}
