import { CommonModule } from "@angular/common";
import { Component, effect, input, signal } from "@angular/core";
import { ChartData, ChartOptions } from "chart.js";
import { BaseChartDirective } from "ng2-charts";
import { EventExpenseTypes } from "src/app/core/config/event-expense-types";
import { SDK } from "src/sdk";
import { getExpenseAmount } from "../../helpers/event-person-days";

const UNTYPED_EXPENSE = { title: "Bez typu", color: "#b8bcc8" };

const currencyFormat = new Intl.NumberFormat("cs", { style: "currency", currency: "CZK" });

@Component({
	selector: "bo-event-expenses-chart",
	templateUrl: "./event-expenses-chart.component.html",
	styleUrls: ["./event-expenses-chart.component.scss"],

	imports: [CommonModule, BaseChartDirective],
})
export class EventExpensesChartComponent {
	expenses = input<SDK.EventExpenseResponseWithLinks[] | undefined>();
	personDays = input(1);

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

	constructor() {
		effect(() => {
			const expenses = this.expenses();
			if (expenses) this.updateChart(expenses);
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

	private sumAmounts(expenses: SDK.EventExpenseResponseWithLinks[]): number {
		return expenses.reduce((acc, e) => acc + getExpenseAmount(e), 0);
	}
}
