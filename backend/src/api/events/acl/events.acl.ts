import { Request } from "express";
import { AcPermission } from "src/access-control/access-control-lib/schema/ac-entity";
import { RouteEntity } from "src/access-control/schema/route-entity";
import { CanWhereData } from "src/access-control/util/can-where";
import { Event, EventStatus } from "src/models/events/entities/event.entity";

export const publicEvents: AcPermission<Event, CanWhereData> = {
  permission: ({ doc }) => doc.status === EventStatus.public,
  where: (q) => q.where("status = :status", { status: EventStatus.public }),
};

export const isMyEvent = (doc: Event | undefined, req: Request) =>
  doc?.leaders?.some((l) => l.id === req.user?.userId) ?? false;

export const EventsACL: RouteEntity<Event, CanWhereData> = {
  permissions: {
    vedouci: true,
    verejnost: publicEvents,
  },
};

export const EventACL: RouteEntity<Event, CanWhereData> = {
  permissions: {
    vedouci: true,
    verejnost: publicEvents,
  },
};

export const EventCreateACL: RouteEntity = {
  permissions: {
    vedouci: true,
  },
};

export const EventEditACL: RouteEntity<Event> = {
  permissions: {
    vedouci: ({ doc, req }) => isMyEvent(doc, req),
  },
  parent: EventACL,
};
export const EventUpdateACL: RouteEntity<Event> = { inherits: EventEditACL, parent: EventACL };
export const EventDeleteACL: RouteEntity<Event> = { inherits: EventEditACL, parent: EventACL };

export const EventAttendeesACL: RouteEntity<Event> = {
  permissions: {
    vedouci: ({ doc, req }) => isMyEvent(doc, req),
    verejnost: publicEvents,
  },
  parent: EventACL,
};
