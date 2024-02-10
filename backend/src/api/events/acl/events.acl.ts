import { Request } from "express";
import { RouteACL } from "src/access-control/schema/route-acl";
import { RootResponse } from "src/api/root/dto/root-response";
import { Event, EventStates } from "src/models/events/entities/event.entity";
import { EventCreateBody, EventResponse } from "../dto/event.dto";

export const isMyEvent = (doc: Pick<Event, "attendees"> | undefined, req: Request) =>
  doc?.attendees?.some((l) => l.memberId === req.user?.userId && l.type === "leader") ?? false;

export const EventsListRoute = new RouteACL({
  linkTo: RootResponse,
  contains: EventResponse,

  permissions: {
    vedouci: true,
  },
});

export const EventsYearsRoute = new RouteACL<undefined>({
  linkTo: EventResponse,
  inheritPermissions: EventsListRoute,
});

export const EventReadRoute = new RouteACL<Event>({
  contains: EventResponse,

  permissions: {
    vedouci: true,
  },
});

export const EventCreateRoute = new RouteACL<EventCreateBody>({
  linkTo: RootResponse,
  contains: EventResponse,

  permissions: {
    vedouci: true,
  },
});

export const EventEditRoute = new RouteACL<Event>({
  linkTo: EventResponse,

  permissions: {
    admin: true,
    program: true,
    vedouci: ({ doc, req }) => isMyEvent(doc, req),
  },
});

export const EventDeleteRoute = new RouteACL<Event>({
  linkTo: EventResponse,
  permissions: {
    program: true,
    admin: true,
  },
  condition: (doc) => doc.status !== EventStates.public,
});

export const EventLeadRoute = new RouteACL<Event>({
  linkTo: EventResponse,

  permissions: {
    admin: true,
    vedouci: true,
  },

  condition: (doc) => !doc.leaders || !doc.leaders.length,
});

export const EventSubmitRoute = new RouteACL<Event>({
  linkTo: EventResponse,

  permissions: {
    program: true,
    admin: true,
    vedouci: ({ doc, req }) => isMyEvent(doc, req),
  },

  condition: (doc) => doc.status === EventStates.draft,
});

export const EventPublishRoute = new RouteACL<Event>({
  linkTo: EventResponse,
  permissions: {
    program: true,
    admin: true,
  },
  condition: (doc) => doc.status === EventStates.pending,
});

export const EventRejectRoute = new RouteACL<Event>({
  linkTo: EventResponse,
  permissions: {
    program: true,
    admin: true,
  },
  condition: (doc) => doc.status === EventStates.pending,
});

export const EventUnpublishRoute = new RouteACL<Event>({
  linkTo: EventResponse,
  permissions: {
    program: true,
    admin: true,
  },
  condition: (doc) => doc.status === EventStates.public,
});

export const EventCancelRoute = new RouteACL<Event>({
  linkTo: EventResponse,
  permissions: {
    program: true,
    admin: true,
  },
  condition: (doc) => doc.status !== EventStates.public,
});

export const EventUncancelRoute = new RouteACL<Event>({
  linkTo: EventResponse,
  permissions: {
    program: true,
    admin: true,
  },
  condition: (doc) => doc.status === EventStates.cancelled,
});

export const EventRegistrationReadRoute = new RouteACL<Event>({
  linkTo: EventResponse,

  inheritPermissions: EventReadRoute,
});

export const EventRegistrationEditRoute = new RouteACL<Event>({
  linkTo: EventResponse,

  inheritPermissions: EventEditRoute,
});

export const EventReportReadRoute = new RouteACL<Event>({
  linkTo: EventResponse,

  inheritPermissions: EventReadRoute,
});

export const EventReportEditRoute = new RouteACL<Event>({
  linkTo: EventResponse,

  inheritPermissions: EventEditRoute,
});
