import { RouteACL } from "src/access-control/schema/route-acl";
import { MemberResponse } from "src/api/members/dto/member.dto";
import { EventAttendee } from "src/models/events/entities/event-attendee.entity";
import { Event } from "src/models/events/entities/event.entity";
import { EventAttendeeResponse } from "../dto/event-attendee.dto";
import { EventResponse } from "../dto/event.dto";
import { EventReadRoute, isMyEvent } from "./events.acl";

export const EventAttendeesListRoute = new RouteACL<Event, EventAttendeeResponse[]>({
  entity: EventResponse,

  inheritPermissions: EventReadRoute,

  path: (e) => `${e.id}/attendees`,
  contains: {
    array: {
      entity: EventAttendeeResponse,
      properties: { member: { entity: MemberResponse }, event: { entity: EventResponse } },
    },
  },
});

export const EventAttendeeReadRoute = new RouteACL<EventAttendee>({
  entity: EventAttendeeResponse,
  permissions: {
    vedouci: true,
  },
});

export const EventAttendeeCreateRoute = new RouteACL<Event, EventAttendee>({
  entity: EventResponse,

  permissions: {
    vedouci: ({ doc, req }) => isMyEvent(doc, req),
  },

  contains: {
    entity: EventAttendeeResponse,
    properties: { member: { entity: MemberResponse }, event: { entity: EventResponse } },
  },
});

export const EventAttendeeEditRoute = new RouteACL<EventAttendee>({
  entity: EventAttendeeResponse,

  permissions: {
    vedouci: ({ doc, req }) => isMyEvent(doc.event, req),
  },

  path: (d) => `${d.eventId}/attendees/${d.memberId}`,
  contains: { properties: { member: { entity: MemberResponse } } },
});

export const EventAttendeeDeleteRoute = new RouteACL<EventAttendee>({
  entity: EventAttendeeResponse,
  path: (e) => `${e.eventId}/attendees/${e.memberId}`,
  inheritPermissions: EventAttendeeEditRoute,
});
