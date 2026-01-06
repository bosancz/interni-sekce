import { CommonModule } from "@angular/common";
import { Component, effect, input, OnInit } from "@angular/core";
import { ChartData, ChartOptions } from "chart.js";
import { DateTime } from "luxon";
import { BaseChartDirective } from "ng2-charts";
import { EventExpenseTypes } from "src/app/core/config/event-expense-types";
import { ApiService } from "src/app/core/services/api.service";
import { SDK } from "src/sdk";

@Component({
	selector: "bo-event-expenses-chart",
	templateUrl: "./event-expenses-chart.component.html",
	styleUrls: ["./event-expenses-chart.component.scss"],

	imports: [CommonModule, BaseChartDirective],
})
export class EventExpensesChartComponent implements OnInit {
	event = input<SDK.EventResponseWithLinks | undefined>();
	expenses = input<SDK.EventExpenseResponseWithLinks[] | undefined>();

	days: number = 0;
	persons: number = 0;

	total: number = 0;

	totalByType: Record<SDK.EventExpenseTypesEnum, number> = {
		accommodation: 0,
		food: 0,
		material: 0,
		other: 0,
		transport: 0,
	};

	chartData?: ChartData<"doughnut">;

	chartOptions: ChartOptions<"doughnut"> = {
		cutout: "60%",
		plugins: {
			legend: {
				position: "bottom",
				labels: {
					useBorderRadius: true,
				},
			},
		},
	};

	constructor(private api: ApiService) {
		effect(() => {
			const event = this.event();
			const expenses = this.expenses();
			if (event && expenses) {
				this.updateChart(event, expenses);
			}
		});
	}

	ngOnInit() {}

	private async updateChart(event: SDK.EventResponseWithLinks, expenses: SDK.EventExpenseResponseWithLinks[]) {
		this.totalByType = {
			accommodation: 0,
			food: 0,
			material: 0,
			other: 0,
			transport: 0,
		};

		const dateFrom = DateTime.fromISO(event.dateFrom).set({ hour: 0, minute: 0, second: 0, millisecond: 0 });
		const dateTill = DateTime.fromISO(event.dateTill)
			.set({ hour: 0, minute: 0, second: 0, millisecond: 0 })
			.plus({ days: 1 });

		this.days = Math.ceil(dateTill.diff(dateFrom, "days").days);

		const attendees = await this.api.EventsApi.listEventAttendees(event.id).then((res) => res.data);

		this.persons = attendees?.length || 1;

		const data: ChartData<"doughnut">["datasets"][0]["data"] = Object.keys(EventExpenseTypes).map((type) => {
			return this.getTotalExpenseByType(expenses, type as SDK.EventExpenseTypesEnum) / this.persons / this.days;
		});

		this.chartData = {
			labels: Object.values(EventExpenseTypes).map((t) => t.title),
			datasets: [
				{
					// backgroundColor: EventExpenseTypes[type as EventExpenseTypesEnum].color,
					// tooltip: Math.round(value * 100) / 100 + "/os/den",
					data,
					borderRadius: 4,

					backgroundColor: Object.values(EventExpenseTypes).map((t) => t.color),
				},
			],
		};

		this.total = expenses.reduce((acc, e) => acc + parseFloat(e.amount as any), 0);
	}

	private getTotalExpenseByType(expenses: SDK.EventExpenseResponseWithLinks[], type: SDK.EventExpenseTypesEnum) {
		return expenses.filter((e) => e.type === type).reduce((acc, e) => acc + parseFloat(e.amount as any), 0);
	}
}
