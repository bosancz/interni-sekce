import { RouteACL } from "src/access-control/schema/route-acl";
import { EventAttendee } from "src/models/events/entities/event-attendee.entity";
import { Event } from "src/models/events/entities/event.entity";
import { EventAttendeeResponse } from "../dto/event-attendee.dto";
import { EventResponse } from "../dto/event.dto";
import { EventReadRoute, isMyEvent } from "./events.acl";

export const EventAttendeesListRoute = new RouteACL<Event, EventAttendeeResponse[]>({
  linkTo: EventResponse,
  contains: EventAttendeeResponse,

  inheritPermissions: EventReadRoute,

  path: (e) => `${e.id}/attendees`,
});

export const EventAttendeeReadRoute = new RouteACL<EventAttendee>({
  linkTo: EventAttendeeResponse,
  permissions: {
    vedouci: true,
  },
});

export const EventAttendeeCreateRoute = new RouteACL<Event, EventAttendee>({
  linkTo: EventResponse,
  contains: EventAttendeeResponse,

  permissions: {
    vedouci: ({ doc, req }) => isMyEvent(doc, req),
  },
});

export const EventAttendeeEditRoute = new RouteACL<EventAttendee>({
  linkTo: EventAttendeeResponse,
  contains: EventAttendeeResponse,

  permissions: {
    vedouci: ({ doc, req }) => isMyEvent(doc.event, req),
  },

  path: (d) => `${d.eventId}/attendees/${d.memberId}`,
});

export const EventAttendeeDeleteRoute = new RouteACL<EventAttendee>({
  linkTo: EventAttendeeResponse,
  path: (e) => `${e.eventId}/attendees/${e.memberId}`,
  inheritPermissions: EventAttendeeEditRoute,
});
