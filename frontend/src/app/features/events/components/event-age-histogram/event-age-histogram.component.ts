import { CommonModule } from "@angular/common";
import { Component, effect, input, signal } from "@angular/core";
import { getAge } from "src/helpers/age";
import { SDK } from "src/sdk";

@Component({
	selector: "event-age-histogram",
	templateUrl: "./event-age-histogram.component.html",
	styleUrls: ["./event-age-histogram.component.scss"],

	imports: [CommonModule],
})
export class EventAgeHistogramComponent {
	event = input.required<SDK.EventResponseWithLinks>();
	members = input.required<SDK.MemberResponse[]>();

	countMax = signal<number | undefined>(undefined);

	histogram = signal<Array<{ label: string; count: number }>>([]);

	constructor() {
		effect(() => {
			const event = this.event();
			this.members();
			this.updateAges(event);
		});
	}

	updateAges(event: SDK.EventResponseWithLinks): void {
		const members = this.members();

		const ages = members
			.map((member) => getAge(member.birthday, event.dateFrom))
			.filter((age): age is number => age !== null);

		if (!ages.length) {
			this.histogram.set([]);
			this.countMax.set(0);
			return;
		}

		const counts = new Map<number, number>();
		for (const age of ages) counts.set(age, (counts.get(age) ?? 0) + 1);

		const histogram = [...counts.entries()]
			.sort(([a], [b]) => a - b)
			.map(([age, count]) => ({ label: `${age}`, count }));

		this.histogram.set(histogram);
		this.countMax.set(Math.max(...histogram.map((bar) => bar.count)));
	}
}
