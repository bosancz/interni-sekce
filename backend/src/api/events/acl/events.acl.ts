import { Request } from "express";
import { RouteACL } from "src/access-control/schema/route-acl";
import { MemberResponse } from "src/api/members/dto/member.dto";
import { Event } from "src/models/events/entities/event.entity";
import { EventResponse } from "../dto/event.dto";

export const isMyEvent = (doc: Pick<Event, "leaders"> | undefined, req: Request) =>
  doc?.leaders?.some((l) => l.id === req.user?.userId) ?? false;

export const EventsRoute = new RouteACL<EventResponse, EventResponse[]>({
  permissions: {
    vedouci: true,
    verejnost: true,
  },
  contains: { array: { entity: EventResponse } },
});

export const EventRoute = new RouteACL({
  entity: EventResponse,

  permissions: {
    vedouci: true,
  },
  contains: { properties: { leaders: { array: { entity: MemberResponse } } } },
});

export const EventCreateRoute = new RouteACL<any>({
  permissions: {
    vedouci: true,
  },
  contains: { entity: EventResponse },
});

export const EventEditRoute = new RouteACL<EventResponse>({
  entity: EventResponse,

  permissions: {
    vedouci: ({ doc, req }) => isMyEvent(doc, req),
  },
});

export const EventDeleteRoute = new RouteACL({
  entity: EventResponse,
  inheritPermissions: EventEditRoute,
});
