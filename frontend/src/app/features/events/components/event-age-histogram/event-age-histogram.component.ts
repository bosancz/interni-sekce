import { I18nPluralPipe } from "@angular/common";
import { Component, computed, input } from "@angular/core";
import { FareAgeBand, FareAgeBands } from "src/app/core/config/fare-age-bands";
import { getAge } from "src/helpers/age";
import { SDK } from "src/sdk";

type AgeCategory = "child" | "instructor" | "leader";

type AgeRow = { age: number; people: { nickname: string; category: AgeCategory }[]; names: string };

type AgeBand = { label: string; count: number; rows: AgeRow[] };

@Component({
	selector: "event-age-histogram",
	templateUrl: "./event-age-histogram.component.html",
	styleUrls: ["./event-age-histogram.component.scss"],

	imports: [I18nPluralPipe],
})
export class EventAgeHistogramComponent {
	event = input.required<SDK.EventResponseWithLinks>();
	attendees = input.required<SDK.MemberResponse[]>();
	leaders = input.required<SDK.MemberResponse[]>();

	readonly peoplePluralMap = { "=1": "# člověk", "=2": "# lidé", "=3": "# lidé", "=4": "# lidé", other: "# lidí" };

	bands = computed<AgeBand[]>(() => {
		const dateFrom = this.event().dateFrom;
		const people = [
			...this.attendees().map((member) => ({ member, leader: false })),
			...this.leaders().map((member) => ({ member, leader: true })),
		]
			.map(({ member, leader }) => ({
				age: getAge(member.birthday, dateFrom),
				nickname: member.nickname,
				category: this.getCategory(member, leader),
			}))
			.filter(
				(person): person is { age: number; nickname: string; category: AgeCategory } => person.age !== null,
			);

		if (!people.length) return [];

		const min = Math.min(...people.map((person) => person.age));
		const max = Math.max(...people.map((person) => person.age));
		const order: AgeCategory[] = ["child", "instructor", "leader"];

		return FareAgeBands.filter((band) => band.from <= max && (band.till === null || band.till >= min)).map(
			(band) => {
				const rows: AgeRow[] = [];
				for (let age = Math.max(band.from, min); age <= Math.min(band.till ?? max, max); age++) {
					const agePeople = people
						.filter((person) => person.age === age)
						.sort((a, b) => order.indexOf(a.category) - order.indexOf(b.category));
					rows.push({ age, people: agePeople, names: agePeople.map((person) => person.nickname).join(", ") });
				}
				return {
					label: this.getBandLabel(band),
					count: rows.reduce((sum, row) => sum + row.people.length, 0),
					rows,
				};
			},
		);
	});

	private getCategory(member: SDK.MemberResponse, leader: boolean): AgeCategory {
		if (member.role === "instruktor") return "instructor";
		if (member.role === "vedouci" || leader) return "leader";
		return "child";
	}

	private getBandLabel(band: FareAgeBand) {
		if (band.till === null) return `${band.from}+ let`;
		if (band.from === 0) return `do ${band.till + 1} let`;
		return `${band.from}–${band.till} let`;
	}
}
