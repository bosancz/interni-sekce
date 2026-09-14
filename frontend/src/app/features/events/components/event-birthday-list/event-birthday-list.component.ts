import { CommonModule } from "@angular/common";
import { Component, effect, input, signal } from "@angular/core";
import { IonItem, IonLabel, IonList } from "@ionic/angular/standalone";
import { getAge, hasBirthdayBetween } from "src/helpers/age";
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
	birthdays = signal<Array<{ age: number; date: string; member: SDK.MemberResponse }>>([]);

	constructor() {
		effect(() => {
			const event = this.event();
			this.members();
			this.updateBirthdays(event);
		});
	}

	updateBirthdays(event: SDK.EventResponseWithLinks) {
		const members = this.members();

		const birthdays: Array<{ age: number; date: string; member: SDK.MemberResponse }> = [];
		members.forEach((member) => {
			if (!member.birthday) return;
			if (!hasBirthdayBetween(member.birthday, event.dateFrom, event.dateTill)) return;
			birthdays.push({ age: getAge(member.birthday, event.dateTill)!, date: member.birthday, member });
		});

		this.birthdays.set(birthdays);
	}
}
