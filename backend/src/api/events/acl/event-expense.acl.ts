import { Permission } from "src/access-control/schema/route-acl";
import { EventExpenseResponse } from "../dto/event-expense.dto";
import { EventResponse } from "../dto/event.dto";
import { EventReadRoute, isMyEvent } from "./events.acl";

export const EventExpensesListRoute = new Permission({
	linkTo: EventResponse,
	contains: EventExpenseResponse,

	inherit: EventReadRoute,

	path: (e) => `${e.id}/attendees`,
});

export const EventExpenseReadRoute = new Permission({
	linkTo: EventExpenseResponse,
	allowed: {
		vedouci: true,
	},
});

export const EventExpenseCreateRoute = new Permission({
	linkTo: EventResponse,
	contains: EventExpenseResponse,

	allowed: {
		vedouci: ({ doc, req }) => isMyEvent(doc, req),
	},
});

export const EventExpenseEditRoute = new Permission({
	linkTo: EventExpenseResponse,

	allowed: {
		admin: true,
		vedouci: ({ doc, req }) => isMyEvent(doc.event, req),
	},

	path: (d) => `${d.eventId}/expenses/${d.id}`,
});

export const EventExpenseDeleteRoute = new Permission({
	linkTo: EventExpenseResponse,
	path: (d) => `${d.eventId}/expenses/${d.id}`,
	inherit: EventExpenseEditRoute,
});
