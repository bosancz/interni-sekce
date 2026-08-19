import { CommonModule } from "@angular/common";
import { Component, effect, input, signal } from "@angular/core";
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
		const dateFrom = DateTime.fromISO(event.dateFrom).set({ hour: 0 });

		const ages: number[] = [];
		members.forEach((member) => {
			if (!member.birthday) return;
			ages.push(Math.floor(-1 * DateTime.fromISO(member.birthday).diff(dateFrom, "years").toObject().years!));
		});

		if (!ages.length) {
			this.histogram.set([]);
			this.countMax.set(0);
			return;
		}

		const min = Math.min(...ages);
		const max = Math.max(...ages);

		const binSize = this.getBinSize(max - min + 1);

		const first = Math.floor(min / binSize) * binSize;
		const last = Math.floor(max / binSize) * binSize;

		let countMax = 0;
		const histogram: Array<{ label: string; count: number }> = [];
		for (let from = first; from <= last; from += binSize) {
			const to = from + binSize - 1;
			const count = ages.filter((age) => age >= from && age <= to).length;
			countMax = Math.max(countMax, count);
			histogram.push({ label: binSize === 1 ? `${from}` : `${from}–${to}`, count });
		}

		this.histogram.set(histogram);
		this.countMax.set(countMax);
	}

	private getBinSize(range: number, targetBins = 10): number {
		const niceSizes = [1, 2, 5, 10, 20, 25, 50];
		return niceSizes.find((size) => range / size <= targetBins) ?? 100;
	}
}
