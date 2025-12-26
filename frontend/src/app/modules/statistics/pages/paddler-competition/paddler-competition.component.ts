import { Component, OnInit } from "@angular/core";
import { ActivatedRoute, Params, Router } from "@angular/router";
import { debounceTime, filter, map } from "rxjs/operators";

import { ApiService } from "src/app/services/api.service";

export type Ranked<T> = T & { rank?: number; rankTo?: number };

export interface PaddlerCompetitionMember {
	nickname: string;
	firstName: string;
	lastName: string;
	groupId?: number;
	waterKm: number;
}

export interface PaddlerCompetitionGroup {
	groupId: number;
	waterKm: number;
}

@Component({
	selector: "paddler-competition",
	templateUrl: "./paddler-competition.component.html",
	styleUrls: ["./paddler-competition.component.scss"],
	standalone: false,
})
export class PaddlerCompetitionComponent implements OnInit {
	years: number[] = [];
	year = this.route.params.pipe(map((params: Params) => Number(params.year) || null));
	currentYear?: number;

	rankings: Ranked<PaddlerCompetitionMember>[] = [];
	groups: Ranked<PaddlerCompetitionGroup>[] = [];

	constructor(
		private api: ApiService,
		private router: Router,
		private route: ActivatedRoute,
	) {
		this.year
			.pipe(filter((year): year is Exclude<typeof year, null> => !!year))
			.pipe(debounceTime(500))
			.subscribe((year) => {
				this.loadRanking(year);
				this.currentYear = Number(year);
			});
	}

	ngOnInit() {
		this.loadYears();
	}

	async loadYears() {
		const totals = await this.api.StatisticsApi.getPaddlersTotals().then((res) => res.data);
		this.years = totals.years;
		this.years.sort();
		if (!this.currentYear) this.setYear(this.years[this.years.length - 1]);
	}

	async loadRanking(year: number) {
		const rankings = await this.api.StatisticsApi.getPaddlersRanking(year).then((res) => res.data);

		this.rankings = this.setRanks(rankings);

		const groups: { [key: string]: PaddlerCompetitionGroup } = {};

		rankings.forEach((item) => {
			if (!item.groupId) return;

			if (!(item.groupId in groups)) groups[item.groupId] = { groupId: item.groupId, waterKm: 0 };

			groups[item.groupId].waterKm += item.waterKm;
		});

		this.groups = this.setRanks(Object.values(groups));
	}

	setYear(year: number) {
		this.router.navigate(["./", { year: year }], { relativeTo: this.route });
	}

	setRanks<T extends { waterKm: number }>(ranking: T[]): Ranked<T>[] {
		ranking.sort((a, b) => b.waterKm - a.waterKm);

		let ranked: Ranked<T>[] = [];

		for (let i = 0; i < ranking.length; i++) {
			ranked.push(ranking[i]);

			if (!ranking[i + 1] || ranking[i + 1].waterKm !== ranking[i].waterKm) {
				ranked.forEach((rankedItem) => {
					rankedItem.rank = i + 1 - (ranked.length - 1);
					rankedItem.rankTo = i + 1;
				});
				ranked = [];
			}
		}

		return ranking;
	}
}
