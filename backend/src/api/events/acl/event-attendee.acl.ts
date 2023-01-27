import { RouteEntity } from "src/access-control/schema/route-entity";
import { EventAttendee } from "src/models/events/entities/event-attendee.entity";
import { isMyEvent } from "./events.acl";

export const EventAttendeeACL: RouteEntity<EventAttendee> = {
  permissions: {
    vedouci: true,
  },
};

export const EventAttendeesEditACL: RouteEntity<EventAttendee> = {
  permissions: {
    vedouci: ({ doc, req }) => isMyEvent(doc.event, req),
  },
  parent: EventAttendeeACL,
};

export const EventAttendeesDeleteACL: RouteEntity<EventAttendee> = {
  inherits: EventAttendeesEditACL,
  parent: EventAttendeeACL,
};
