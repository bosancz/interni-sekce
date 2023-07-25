import { RouteACL } from "src/access-control/schema/route-acl";
import { EventExpense } from "src/models/events/entities/event-expense.entity";
import { Event } from "src/models/events/entities/event.entity";
import { EventExpenseResponse } from "../dto/event-expense.dto";
import { EventResponse } from "../dto/event.dto";
import { EventReadRoute, isMyEvent } from "./events.acl";

export const EventExpensesListRoute = new RouteACL<Event, EventExpenseResponse[]>({
  linkTo: EventResponse,
  contains: EventExpenseResponse,

  inheritPermissions: EventReadRoute,

  path: (e) => `${e.id}/attendees`,
});

export const EventExpenseReadRoute = new RouteACL<EventExpense>({
  linkTo: EventExpenseResponse,
  permissions: {
    vedouci: true,
  },
});

export const EventExpenseCreateRoute = new RouteACL<Event, EventExpense>({
  linkTo: EventResponse,
  contains: EventExpenseResponse,

  permissions: {
    vedouci: ({ doc, req }) => isMyEvent(doc, req),
  },
});

export const EventExpenseEditRoute = new RouteACL<EventExpense>({
  linkTo: EventExpenseResponse,

  permissions: {
    vedouci: ({ doc, req }) => isMyEvent(doc.event, req),
  },

  path: (d) => `${d.eventId}/expenses/${d.id}`,
});

export const EventExpenseDeleteRoute = new RouteACL<EventExpense>({
  linkTo: EventExpenseResponse,
  path: (d) => `${d.eventId}/expenses/${d.id}`,
  inheritPermissions: EventExpenseEditRoute,
});
