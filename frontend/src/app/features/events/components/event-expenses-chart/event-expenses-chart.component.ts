import { CommonModule } from "@angular/common";
import { Component, computed, effect, input, signal } from "@angular/core";
import { ChartData, ChartOptions } from "chart.js";
import { DateTime } from "luxon";
import { BaseChartDirective } from "ng2-charts";
import { EventExpenseTypes } from "src/app/core/config/event-expense-types";
import { ApiService } from "src/app/core/services/api.service";
import { SDK } from "src/sdk";

const formatAmount = (amount: number) =>
	amount.toLocaleString("cs", { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + " Kč";

@Component({
	selector: "bo-event-expenses-chart",
	templateUrl: "./event-expenses-chart.component.html",
	styleUrls: ["./event-expenses-chart.component.scss"],

	imports: [CommonModule, BaseChartDirective],
})
export class EventExpensesChartComponent {
	event = input<SDK.EventResponseWithLinks | undefined>();
	expenses = input<SDK.EventExpenseResponseWithLinks[] | undefined>();

	persons = signal<number | undefined>(undefined);

	days = computed(() => {
		const event = this.event();
		if (!event) return undefined;

		const dateFrom = DateTime.fromISO(event.dateFrom).startOf("day");
		const dateTill = DateTime.fromISO(event.dateTill).startOf("day").plus({ days: 1 });
		const days = Math.ceil(dateTill.diff(dateFrom, "days").days);

		return Number.isFinite(days) && days > 0 ? days : undefined;
	});

	totalByType = computed(() => {
		const expenses = this.expenses() ?? [];

		return (Object.keys(EventExpenseTypes) as SDK.EventExpenseTypesEnum[])
			.map((type) => ({
				type,
				total: expenses.filter((e) => e.type === type).reduce((acc, e) => acc + this.parseAmount(e), 0),
			}))
			.filter((entry) => entry.total > 0);
	});

	total = computed(() => (this.expenses() ?? []).reduce((acc, e) => acc + this.parseAmount(e), 0));

	perPersonDay = computed(() => {
		const persons = this.persons();
		const days = this.days();
		return persons && days ? this.total() / persons / days : undefined;
	});

	chartData = computed<ChartData<"doughnut">>(() => {
		const usedTypes = this.totalByType();

		return {
			labels: usedTypes.map((entry) => EventExpenseTypes[entry.type].title),
			datasets: [
				{
					data: usedTypes.map((entry) => entry.total),
					borderRadius: 4,
					backgroundColor: usedTypes.map((entry) => EventExpenseTypes[entry.type].color),
				},
			],
		};
	});

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
					label: (context) => `${context.label}: ${formatAmount(context.parsed)}`,
				},
			},
		},
	};

	private eventId = computed(() => this.event()?.id);

	constructor(private api: ApiService) {
		effect(() => {
			const eventId = this.eventId();
			this.persons.set(undefined);
			if (eventId !== undefined) this.loadPersons(eventId);
		});
	}

	private async loadPersons(eventId: number) {
		const attendees = await this.api.EventsApi.listEventAttendees(eventId).then((res) => res.data);
		if (this.eventId() === eventId) this.persons.set(attendees.length || 1);
	}

	private parseAmount(expense: SDK.EventExpenseResponseWithLinks): number {
		const amount = parseFloat(expense.amount as any);
		return isNaN(amount) ? 0 : amount;
	}
}
