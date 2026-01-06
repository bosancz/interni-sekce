import { CommonModule } from "@angular/common";
import { Component, effect, input } from "@angular/core";
import { DateTime } from "luxon";
import { SDK } from "src/sdk";

@Component({
	selector: "event-age-histogram",
	templateUrl: "./event-age-histogram.component.html",
	styleUrls: ["./event-age-histogram.component.scss"],
	
	imports: [CommonModule],
})
export class EventAgeHistogramComponent {
	event = input.required<SDK.EventResponseWithLinks>();
	min = input<number>(7);
	max = input<number>(18);

	countMax?: number;

	histogram: Array<{ age: number; count: number }> = [];

	constructor() {
		effect(() => {
			const event = this.event();
			this.updateAges(event);
		});
	}

	updateAges(event: SDK.EventResponseWithLinks): void {
		const members = event.attendees?.map((ea) => ea.member!) || [];

		const ages: { [age: string]: number } = {};
		var countMax = 0;

		const dateFrom = DateTime.fromISO(event.dateFrom).set({ hour: 0 });
		const dateTill = DateTime.fromISO(event.dateTill).set({ hour: 23, minute: 59 });

		const min = this.min();
		const max = this.max();

		members.forEach((member) => {
			if (!member.birthday) return;

			var age = Math.floor(-1 * DateTime.fromISO(member.birthday).diff(dateFrom, "years").toObject().years!);

			age = Math.max(min, Math.min(max, age));

			ages[age] = ages[age] ? ages[age] + 1 : 1;
			countMax = Math.max(countMax, ages[age]);
		});

		this.countMax = countMax;

		this.histogram = [];
		for (let i = min; i <= max; i++) this.histogram.push({ age: i, count: ages[i] || 0 });
	}
}
