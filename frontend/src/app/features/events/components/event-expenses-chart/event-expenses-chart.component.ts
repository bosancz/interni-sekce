import { CommonModule } from "@angular/common";
import { Component, effect, input, OnInit, signal } from "@angular/core";
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

	days = signal(0);
	persons = signal(0);

	total = signal(0);

	totalByType: Record<SDK.EventExpenseTypesEnum, number> = {
		accommodation: 0,
		food: 0,
		material: 0,
		other: 0,
		transport: 0,
	};

	chartData = signal<ChartData<"doughnut"> | undefined>(undefined);

	chartOptions: ChartOptions<"doughnut"> = {
		responsive: true,
		maintainAspectRatio: false,
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

		const days = Math.ceil(dateTill.diff(dateFrom, "days").days);
		this.days.set(days);

		const attendees = await this.api.EventsApi.listEventAttendees(event.id).then((res) => res.data);

		const persons = attendees?.length || 1;
		this.persons.set(persons);

		const usedTypes = (Object.keys(EventExpenseTypes) as SDK.EventExpenseTypesEnum[])
			.map((type) => ({ type, total: this.getTotalExpenseByType(expenses, type) }))
			.filter((entry) => entry.total > 0);

		this.chartData.set({
			labels: usedTypes.map((entry) => EventExpenseTypes[entry.type].title),
			datasets: [
				{
					data: usedTypes.map((entry) => entry.total / persons / days),
					borderRadius: 4,
					backgroundColor: usedTypes.map((entry) => EventExpenseTypes[entry.type].color),
				},
			],
		});

		this.total.set(expenses.reduce((acc, e) => acc + this.parseAmount(e), 0));
	}

	private getTotalExpenseByType(expenses: SDK.EventExpenseResponseWithLinks[], type: SDK.EventExpenseTypesEnum) {
		return expenses.filter((e) => e.type === type).reduce((acc, e) => acc + this.parseAmount(e), 0);
	}

	private parseAmount(expense: SDK.EventExpenseResponseWithLinks): number {
		const amount = parseFloat(expense.amount as any);
		return isNaN(amount) ? 0 : amount;
	}
}
