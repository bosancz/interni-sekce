import { Request } from "express";
import { AcEntity, AcPermission } from "src/access-control/schema/ac-entity";
import { EventAttendee } from "src/models/events/entities/event-attendee.entity";
import { Event, EventStatus } from "src/models/events/entities/event.entity";
import { Roles } from "src/shared/schema/roles";
import { AcWhereData } from "src/shared/util/ac-where";

const publicEvents: AcPermission<Event, AcWhereData> = {
  permission: ({ doc }) => doc.status === EventStatus.public,
  where: (q) => q.where("status = :status", { status: EventStatus.public }),
};

const isMyEvent = (doc: Event | undefined, req: Request) =>
  doc?.leaders?.some((l) => l.id === req.user?.userId) ?? false;

export const EventsACL: AcEntity<Roles> = {
  permissions: {
    vedouci: true,
    clen: publicEvents,
    verejnost: publicEvents,
  },
};

export const EventACL: AcEntity<Roles, Event, AcWhereData> = {
  permissions: {
    vedouci: true,
    clen: publicEvents,
    verejnost: publicEvents,
  },
};

export const EventEditACL: AcEntity<Roles, Event> = {
  permissions: {
    vedouci: ({ doc, req }) => isMyEvent(doc, req),
  },
  parent: EventACL,
};

export const EventCreateACL: AcEntity<Roles> = { inherits: EventEditACL, parent: EventACL };
export const EventUpdateACL: AcEntity<Roles, Event> = { inherits: EventEditACL, parent: EventACL };
export const EventDeleteACL: AcEntity<Roles, Event> = { inherits: EventEditACL, parent: EventACL };

export const EventAttendeesACL: AcEntity<Roles, Event> = {
  permissions: {
    vedouci: ({ doc, req }) => isMyEvent(doc, req),
    clen: publicEvents,
    verejnost: publicEvents,
  },
  parent: EventACL,
};

export const EventAttendeeACL: AcEntity<Roles, EventAttendee> = {};

export const EventAttendeesEditACL: AcEntity<Roles, EventAttendee> = {
  permissions: {
    vedouci: ({ doc, req }) => isMyEvent(doc.event, req),
  },
  parent: EventAttendeeACL,
};

export const EventAttendeesDeleteACL: AcEntity<Roles, EventAttendee> = {
  inherits: EventAttendeesEditACL,
  parent: EventAttendeeACL,
};
