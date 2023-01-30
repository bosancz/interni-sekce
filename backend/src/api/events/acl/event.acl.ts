import { Request } from "express";
import { RouteEntity } from "src/access-control/schema/route-entity";
import { MemberRoute } from "src/api/members/acl/members.acl";
import { Event } from "src/models/events/entities/event.entity";

export const isMyEvent = (doc: Pick<Event, "leaders"> | undefined, req: Request) =>
  doc?.leaders?.some((l) => l.id === req.user?.userId) ?? false;

export const EventRoute = new RouteEntity<Pick<Event, "status">, Event>({
  permissions: {
    vedouci: true,
  },
  contains: { properties: { leaders: { array: { entity: MemberRoute } } } },
});

export const EventCreateRoute = new RouteEntity<any>({
  permissions: {
    vedouci: true,
  },
  contains: { entity: EventRoute },
});

export const EventEditRoute = new RouteEntity<Event>({
  permissions: {
    vedouci: ({ doc, req }) => isMyEvent(doc, req),
  },
  linkTo: EventRoute,
});

export const EventDeleteRoute = new RouteEntity<Event>({
  inheritPermissions: EventEditRoute,
  linkTo: EventRoute,
});
