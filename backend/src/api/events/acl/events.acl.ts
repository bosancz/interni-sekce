import { AcEntity } from "src/access-control/schema/ac-entity";
import { Event, EventStatus } from "src/models/events/entities/event.entity";
import { QueryFilter } from "src/shared/schema/query-filter";

export enum Roles {
  "vedouci" = "vedouci",
  "clen" = "clen",
  "verejnost" = "verejnost",
}

export const EventsACL: AcEntity<Roles> = {
  permissions: {
    vedouci: true,
    clen: true,
    verejnost: true,
  },
};

export const EventACL: AcEntity<Roles, Event, QueryFilter> = {
  permissions: {
    vedouci: true,
    clen: true,
    verejnost: {
      filter: (d) => d.status === EventStatus.public,
      where: (q, i) => q.where("status = :status", { status: EventStatus.public }),
    },
  },
};

export const EventAttendeesACL: AcEntity<Roles> = {
  permissions: {
    vedouci: true,
    clen: true,
  },
  parent: EventACL,
};
