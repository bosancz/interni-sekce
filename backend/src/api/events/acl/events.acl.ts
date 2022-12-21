import { AcEntity, AcPermission } from "src/access-control/schema/ac-entity";
import { Event, EventStatus } from "src/models/events/entities/event.entity";
import { Roles } from "src/shared/schema/roles";
import { AcWhereData } from "src/shared/util/ac-where";
import { EventWithLeaders } from "../../../models/events/schema/event-with-leaders";

const publicEvents: AcPermission<Pick<Event, "status">, AcWhereData> = {
  permission: ({ doc }) => doc.status === EventStatus.public,
  where: (q) => q.where("status = :status", { status: EventStatus.public }),
};

export const EventsACL: AcEntity<Roles> = {
  permissions: {
    vedouci: true,
    clen: true,
    verejnost: true,
  },
};

export const EventACL: AcEntity<Roles, Event, AcWhereData> = {
  permissions: {
    vedouci: true,
    clen: publicEvents,
    verejnost: publicEvents,
  },
};

export const EventEditACL: AcEntity<Roles, EventWithLeaders> = {
  permissions: {
    vedouci: ({ doc, req }) => doc.leaders.some((member) => member.id === req.user?.userId),
  },
  parent: EventACL,
};

export const EventCreateACL: AcEntity<Roles> = { inherits: EventEditACL, parent: EventACL };
export const EventUpdateACL: AcEntity<Roles, EventWithLeaders> = { inherits: EventEditACL, parent: EventACL };
export const EventDeleteACL: AcEntity<Roles, EventWithLeaders> = { inherits: EventEditACL, parent: EventACL };

export const EventAttendeesACL: AcEntity<Roles, Pick<Event, "id" | "status">> = {
  permissions: {
    vedouci: true,
    clen: publicEvents,
  },
  parent: EventACL,
};
