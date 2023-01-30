import { RouteACL } from "src/access-control/schema/route-acl";
import { MemberResponse } from "src/api/members/dto/member.dto";
import { EventAttendeeResponse } from "../dto/event-attendee.dto";
import { EventResponse } from "../dto/event.dto";
import { isMyEvent } from "./events.acl";

export const EventAttendeesRoute = new RouteACL<EventResponse, EventAttendeeResponse[]>({
  entity: EventResponse,

  permissions: {
    vedouci: true,
  },

  path: (e) => `${e.id}/attendees`,
  contains: {
    array: {
      entity: EventAttendeeResponse,
      properties: { member: { entity: MemberResponse }, event: { entity: EventResponse } },
    },
  },
});

export const EventAttendeeRoute = new RouteACL<EventAttendeeResponse>({
  entity: EventAttendeeResponse,
  permissions: {
    vedouci: true,
  },
});

export const EventAttendeeEditRoute = new RouteACL<EventAttendeeResponse>({
  entity: EventAttendeeResponse,

  permissions: {
    vedouci: ({ doc, req }) => isMyEvent(doc.event, req),
  },

  path: (d) => `${d.eventId}/attendees/${d.memberId}`,
  contains: { properties: { member: { entity: MemberResponse } } },
});

export const EventAttendeeDeleteRoute = new RouteACL<EventAttendeeResponse>({
  entity: EventAttendeeResponse,
  path: (e) => `${e.eventId}/attendees/${e.memberId}`,
  inheritPermissions: EventAttendeeEditRoute,
});
