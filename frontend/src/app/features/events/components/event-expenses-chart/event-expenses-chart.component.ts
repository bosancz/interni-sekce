import { CommonModule } from "@angular/common";
import { Component, effect, input, signal } from "@angular/core";
import { ChartData, ChartOptions } from "chart.js";
import { DateTime } from "luxon";
import { BaseChartDirective } from "ng2-charts";
import { EventExpenseTypes } from "src/app/core/config/event-expense-types";
import { ApiService } from "src/app/core/services/api.service";
import { SDK } from "src/sdk";

const UNTYPED_EXPENSE = { title: "Bez typu", color: "#b8bcc8" };

const currencyFormat = new Intl.NumberFormat("cs", { style: "currency", currency: "CZK" });

@Component({
	selector: "bo-event-expenses-chart",
	templateUrl: "./event-expenses-chart.component.html",
	styleUrls: ["./event-expenses-chart.component.scss"],

	imports: [CommonModule, BaseChartDirective],
})
export class EventExpensesChartComponent {
	event = input<SDK.EventResponseWithLinks | undefined>();
	expenses = input<SDK.EventExpenseResponseWithLinks[] | undefined>();

	days = signal(1);
	persons = signal(1);

	total = signal(0);

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
			tooltip: {
				callbacks: {
					label: (item) => ` ${currencyFormat.format(item.parsed)}`,
				},
			},
		},
	};

	private attendeesRequest = 0;

	constructor(private api: ApiService) {
		effect(() => {
			const expenses = this.expenses();
			if (expenses) this.updateChart(expenses);
		});

		effect(() => {
			const event = this.event();
			if (event) {
				this.updateDays(event);
				this.updatePersons(event);
			}
		});
	}

	private updateChart(expenses: SDK.EventExpenseResponseWithLinks[]) {
		const slices = (Object.keys(EventExpenseTypes) as SDK.EventExpenseTypesEnum[])
			.map((type) => ({
				title: EventExpenseTypes[type].title,
				color: EventExpenseTypes[type].color,
				total: this.sumAmounts(expenses.filter((e) => e.type === type)),
			}))
			.concat({
				...UNTYPED_EXPENSE,
				total: this.sumAmounts(expenses.filter((e) => !e.type || !(e.type in EventExpenseTypes))),
			})
			.filter((slice) => slice.total > 0);

		this.chartData.set({
			labels: slices.map((slice) => slice.title),
			datasets: [
				{
					data: slices.map((slice) => slice.total),
					borderRadius: 4,
					backgroundColor: slices.map((slice) => slice.color),
				},
			],
		});

		this.total.set(this.sumAmounts(expenses));
	}

	private updateDays(event: SDK.EventResponseWithLinks) {
		const dateFrom = DateTime.fromISO(event.dateFrom).startOf("day");
		const dateTill = DateTime.fromISO(event.dateTill).startOf("day").plus({ days: 1 });

		const days = Math.ceil(dateTill.diff(dateFrom, "days").days);
		this.days.set(days > 0 ? days : 1);
	}

	private async updatePersons(event: SDK.EventResponseWithLinks) {
		const request = ++this.attendeesRequest;

		const attendees = await this.api.EventsApi.listEventAttendees(event.id)
			.then((res) => res.data)
			.catch(() => []);

		if (request !== this.attendeesRequest) return;

		this.persons.set(attendees.length || 1);
	}

	private sumAmounts(expenses: SDK.EventExpenseResponseWithLinks[]): number {
		return expenses.reduce((acc, e) => acc + this.parseAmount(e), 0);
	}

	private parseAmount(expense: SDK.EventExpenseResponseWithLinks): number {
		const amount = parseFloat(expense.amount as any);
		return isNaN(amount) ? 0 : amount;
	}
}
