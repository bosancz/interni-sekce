import { RouteEntity } from "src/access-control/schema/route-entity";
import { MemberRoute } from "src/api/members/acl/members.acl";
import { EventAttendeeResponse } from "../dto/event-attendee.dto";
import { isMyEvent } from "./event.acl";

export const EventAttendeeRoute = new RouteEntity<EventAttendeeResponse>({
  permissions: {
    vedouci: true,
  },
});

export const EventAttendeeEditRoute = new RouteEntity<EventAttendeeResponse>({
  permissions: {
    vedouci: ({ doc, req }) => isMyEvent(doc.event, req),
  },

  linkTo: EventAttendeeRoute,
  path: (d) => `${d.eventId}/attendees/${d.memberId}`,
  contains: { properties: { member: { entity: MemberRoute } } },
});

export const EventAttendeeDeleteRoute = new RouteEntity<EventAttendeeResponse>({
  path: (e) => `${e.eventId}/attendees/${e.memberId}`,
  inheritPermissions: EventAttendeeEditRoute,
  linkTo: EventAttendeeRoute,
});
