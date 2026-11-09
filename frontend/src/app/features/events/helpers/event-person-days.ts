import { DateTime } from "luxon";
import { SDK } from "src/sdk";

export function getEventDays(event: Pick<SDK.EventResponseWithLinks, "dateFrom" | "dateTill">): number {
	const dateFrom = DateTime.fromISO(event.dateFrom).startOf("day");
	const dateTill = DateTime.fromISO(event.dateTill).startOf("day").plus({ days: 1 });

	const days = Math.ceil(dateTill.diff(dateFrom, "days").days);
	return days > 0 ? days : 1;
}

export function getExpenseAmount(expense: Pick<SDK.EventExpenseResponseWithLinks, "amount">): number {
	const amount = parseFloat(expense.amount as any);
	return isNaN(amount) ? 0 : amount;
}
