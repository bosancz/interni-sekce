import { CommonModule } from "@angular/common";
import { Component, computed, input } from "@angular/core";
import { EventExpenseTypes } from "src/app/core/config/event-expense-types";
import { SDK } from "src/sdk";
import { getExpenseAmount } from "../../helpers/event-person-days";

const UNTYPED_EXPENSE = { title: "Bez typu", color: "#b8bcc8" };

@Component({
	selector: "bo-event-expenses-chart",
	templateUrl: "./event-expenses-chart.component.html",
	styleUrls: ["./event-expenses-chart.component.scss"],

	imports: [CommonModule],
})
export class EventExpensesChartComponent {
	expenses = input<SDK.EventExpenseResponseWithLinks[] | undefined>();
	personDays = input(1);

	total = computed(() => sumAmounts(this.expenses() ?? []));

	slices = computed(() => {
		const expenses = this.expenses() ?? [];
		const slices = (Object.keys(EventExpenseTypes) as SDK.EventExpenseTypesEnum[])
			.map((type) => ({
				title: EventExpenseTypes[type].title,
				color: EventExpenseTypes[type].color,
				total: sumAmounts(expenses.filter((e) => e.type === type)),
			}))
			.concat({
				...UNTYPED_EXPENSE,
				total: sumAmounts(expenses.filter((e) => !e.type || !(e.type in EventExpenseTypes))),
			})
			.filter((slice) => slice.total > 0)
			.sort((a, b) => b.total - a.total);

		const max = slices[0]?.total || 1;
		return slices.map((slice) => ({ ...slice, ratio: slice.total / max }));
	});
}

function sumAmounts(expenses: SDK.EventExpenseResponseWithLinks[]): number {
	return expenses.reduce((acc, e) => acc + getExpenseAmount(e), 0);
}
