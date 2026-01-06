import { Component, OnInit, signal } from "@angular/core";
import { FormsModule } from "@angular/forms";
import { ActivatedRoute, Params, Router } from "@angular/router";
import { DateTime } from "luxon";
import { debounceTime } from "rxjs/operators";
import { BaseChartDirective } from "ng2-charts";
import { ChartConfiguration } from "chart.js";
import { ListSliderComponent } from "../../components/list-slider/list-slider.component";

import { ApiService } from "src/app/services/api.service";
import { SDK } from "src/sdk";

class ChartData {
	data: { data: number[]; label?: string }[] = [];

	labels: string[] = [];
}

@Component({
	selector: "events-dashboard",
	templateUrl: "./events-dashboard.component.html",
	styleUrls: ["./events-dashboard.component.scss"],
	standalone: true,
	imports: [FormsModule, BaseChartDirective, ListSliderComponent],
})
export class EventsDashboardComponent implements OnInit {
	eventsReport = signal<SDK.EventsReportResponse | undefined>(undefined);
	leadersReport = signal<SDK.EventsLeadersReportResponse | undefined>(undefined);
	attendeesReport = signal<SDK.EventsAttendeesReportResponse | undefined>(undefined);

	minYear = signal<number | undefined>(undefined);
	maxYear = signal<number | undefined>(undefined);
	years = signal<number[]>([]);
	year = signal<number | undefined>(undefined);

	chartData = signal({
		leaders: new ChartData(),
		attendees: new ChartData(),
	});

	constructor(
		private api: ApiService,
		private route: ActivatedRoute,
		private router: Router,
	) {}
	ngOnInit() {
		this.route.params.pipe(debounceTime(500)).subscribe((params: Params) => {
			if (params.year) {
				this.year.set(Number(params.year) || undefined);
				this.loadData(params.year);
			} else {
				this.setYear(DateTime.local().year);
			}
		});

		this.loadEventYears();
	}

	async loadEventYears() {
		const years = await this.api.StatisticsApi.getEventsReportYears().then((res) => res.data);
		years.sort();
		this.years.set(years);
	}

	async loadData(year: number) {
		const eventsReport = await this.api.StatisticsApi.getEventsReport().then((res) => res.data);
		this.eventsReport.set(eventsReport);

		const leadersReport = await this.api.StatisticsApi.getEventsLeadersReport().then((res) => res.data);
		this.leadersReport.set(leadersReport);

		const attendeesReport = await this.api.StatisticsApi.getEventsAttendeesReport().then((res) => res.data);
		this.attendeesReport.set(attendeesReport);

		this.chartData.set({
			leaders: {
				data: [{ data: Object.values(leadersReport.age) }],
				labels: Object.keys(leadersReport.age),
			},
			attendees: {
				data: [{ data: Object.values(attendeesReport.age) }],
				labels: Object.keys(attendeesReport.age),
			},
		});
	}

	setYear(year: number) {
		this.router.navigate(["./", { year: year }], { relativeTo: this.route });
	}

	joinMembers(members: SDK.MemberResponse[]): string {
		if (!members || !members.length) return "";
		return (
			members
				.slice(0, members.length - 1)
				.map((member) => member.nickname)
				.join(", ") +
			(members.length > 1 ? " a " : "") +
			members[members.length - 1].nickname
		);
	}
}
