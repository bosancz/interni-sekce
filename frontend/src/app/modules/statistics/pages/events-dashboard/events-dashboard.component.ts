import { Component, OnInit } from "@angular/core";
import { ActivatedRoute, Params, Router } from "@angular/router";
import { DateTime } from "luxon";
import { debounceTime } from "rxjs/operators";

class ChartData {
	data: { data: number[]; label?: string }[] = [];

	labels: string[] = [];
}

@Component({
	selector: "events-dashboard",
	templateUrl: "./events-dashboard.component.html",
	styleUrls: ["./events-dashboard.component.scss"],
	standalone: false,
})
export class EventsDashboardComponent implements OnInit {
	eventsReport?: BackendApiTypes.EventsReportResponse;
	leadersReport?: BackendApiTypes.EventsLeadersReportResponse;
	attendeesReport?: BackendApiTypes.EventsAttendeesReportResponse;

	minYear?: number;
	maxYear?: number;
	years: number[] = [];
	year?: number;

	chartData = {
		leaders: new ChartData(),
		attendees: new ChartData(),
	};

	constructor(
		private api: BackendApi,
		private route: ActivatedRoute,
		private router: Router,
	) {}
	ngOnInit() {
		this.route.params.pipe(debounceTime(500)).subscribe((params: Params) => {
			if (params.year) {
				this.year = Number(params.year) || undefined;
				this.loadData(params.year);
			} else {
				this.setYear(DateTime.local().year);
			}
		});

		this.loadEventYears();
	}

	async loadEventYears() {
		this.years = await this.api.StatisticsApi.getEventsReportYears().then((res) => res.data);
		this.years.sort();
	}

	async loadData(year: number) {
		this.eventsReport = await this.api.StatisticsApi.getEventsReport().then((res) => res.data);

		this.leadersReport = await this.api.StatisticsApi.getEventsLeadersReport().then((res) => res.data);
		this.attendeesReport = await this.api.StatisticsApi.getEventsAttendeesReport().then((res) => res.data);

		this.chartData.leaders = {
			data: [{ data: Object.values(this.leadersReport.age) }],
			labels: Object.keys(this.leadersReport.age),
		};
		this.chartData.attendees = {
			data: [{ data: Object.values(this.attendeesReport.age) }],
			labels: Object.keys(this.attendeesReport.age),
		};
	}

	setYear(year: number) {
		this.router.navigate(["./", { year: year }], { relativeTo: this.route });
	}

	joinMembers(members: BackendApiTypes.MemberResponse[]): string {
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
