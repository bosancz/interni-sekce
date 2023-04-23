import { RouteACL } from "src/access-control/schema/route-acl";
import { EventExpense } from "src/models/events/entities/event-expense.entity";
import { Event } from "src/models/events/entities/event.entity";
import { EventExpenseResponse } from "../dto/event-expense.dto";
import { EventResponse } from "../dto/event.dto";
import { EventReadRoute, isMyEvent } from "./events.acl";

export const EventExpensesListRoute = new RouteACL<Event, EventExpenseResponse[]>({
  entity: EventResponse,

  inheritPermissions: EventReadRoute,

  path: (e) => `${e.id}/attendees`,
  contains: {
    array: {
      entity: EventExpenseResponse,
    },
  },
});

export const EventExpenseReadRoute = new RouteACL<EventExpense>({
  entity: EventExpenseResponse,
  permissions: {
    vedouci: true,
  },
});

export const EventExpenseCreateRoute = new RouteACL<Event, EventExpense>({
  entity: EventResponse,

  permissions: {
    vedouci: ({ doc, req }) => isMyEvent(doc, req),
  },

  contains: {
    entity: EventExpenseResponse,
  },
});

export const EventExpenseEditRoute = new RouteACL<EventExpense>({
  entity: EventExpenseResponse,

  permissions: {
    vedouci: ({ doc, req }) => isMyEvent(doc.event, req),
  },

  path: (d) => `${d.eventId}/expenses/${d.id}`,
});

export const EventExpenseDeleteRoute = new RouteACL<EventExpense>({
  entity: EventExpenseResponse,
  path: (d) => `${d.eventId}/expenses/${d.id}`,
  inheritPermissions: EventExpenseEditRoute,
});
