import { Request } from "express";
import { RouteACL } from "src/access-control/schema/route-acl";
import { AlbumResponse } from "src/api/albums/dto/album.dto";
import { GroupResponse } from "src/api/members/dto/group.dto";
import { MemberResponse } from "src/api/members/dto/member.dto";
import { RootResponse } from "src/api/root/dto/root-response";
import { EventAttendee } from "src/models/events/entities/event-attendee.entity";
import { Event, EventStatus } from "src/models/events/entities/event.entity";
import { EventExpenseResponse } from "../dto/event-expense.dto";
import { EventCreateBody, EventResponse } from "../dto/event.dto";

export const isMyEvent = (doc: Pick<Event, "leaders"> | undefined, req: Request) =>
  doc?.leaders?.some((l) => l.id === req.user?.userId) ?? false;

export const EventsListRoute = new RouteACL<undefined, EventResponse[]>({
  entity: RootResponse,

  permissions: {
    vedouci: true,
  },
  contains: {
    array: {
      entity: EventResponse,
      properties: { leaders: { array: { entity: MemberResponse } } },
    },
  },
});

export const EventReadRoute = new RouteACL<Event, EventResponse>({
  entity: EventResponse,

  permissions: {
    vedouci: true,
  },
  contains: {
    properties: {
      leaders: { array: { entity: MemberResponse } },
      album: { entity: AlbumResponse },
      attendees: { array: { entity: EventAttendee } },
      groups: { array: { entity: GroupResponse } },
      expenses: { array: { entity: EventExpenseResponse } },
    },
  },
});

export const EventCreateRoute = new RouteACL<EventCreateBody, EventResponse>({
  permissions: {
    vedouci: true,
  },
  contains: { entity: EventResponse },
});

export const EventEditRoute = new RouteACL<Event, EventResponse>({
  entity: EventResponse,

  permissions: {
    admin: true,
    program: true,
    vedouci: ({ doc, req }) => isMyEvent(doc, req),
  },
});

export const EventDeleteRoute = new RouteACL<Event, EventResponse>({
  entity: EventResponse,
  permissions: {
    program: true,
    admin: true,
  },
  condition: (doc) => doc.status !== EventStatus.public,
});

export const EventSubmitRoute = new RouteACL<Event, EventResponse>({
  entity: EventResponse,

  permissions: {
    program: true,
    admin: true,
    vedouci: ({ doc, req }) => isMyEvent(doc, req),
  },

  condition: (doc) => doc.status === EventStatus.draft,
});

export const EventPublishRoute = new RouteACL<Event, EventResponse>({
  entity: EventResponse,
  permissions: {
    program: true,
    admin: true,
  },
  condition: (doc) => doc.status === EventStatus.pending,
});

export const EventRejectRoute = new RouteACL<Event, EventResponse>({
  entity: EventResponse,
  permissions: {
    program: true,
    admin: true,
  },
  condition: (doc) => doc.status === EventStatus.pending,
});

export const EventUnpublishRoute = new RouteACL<Event, EventResponse>({
  entity: EventResponse,
  permissions: {
    program: true,
    admin: true,
  },
  condition: (doc) => doc.status === EventStatus.public,
});

export const EventCancelRoute = new RouteACL<Event, EventResponse>({
  entity: EventResponse,
  permissions: {
    program: true,
    admin: true,
  },
  condition: (doc) => doc.status !== EventStatus.public,
});

export const EventUncancelRoute = new RouteACL<Event, EventResponse>({
  entity: EventResponse,
  permissions: {
    program: true,
    admin: true,
  },
  condition: (doc) => doc.status === EventStatus.cancelled,
});

export const EventRegistrationReadRoute = new RouteACL<Event>({
  entity: EventResponse,

  inheritPermissions: EventReadRoute,
});

export const EventRegistrationEditRoute = new RouteACL<Event>({
  entity: EventResponse,

  inheritPermissions: EventEditRoute,
});

export const EventReportReadRoute = new RouteACL<Event>({
  entity: EventResponse,

  inheritPermissions: EventReadRoute,
});

export const EventReportEditRoute = new RouteACL<Event>({
  entity: EventResponse,

  inheritPermissions: EventEditRoute,
});
