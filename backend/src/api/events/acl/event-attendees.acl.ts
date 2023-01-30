import { RouteEntity } from "src/access-control/schema/route-entity";
import { MemberRoute } from "src/api/members/acl/members.acl";
import { Event } from "src/models/events/entities/event.entity";
import { EventAttendeeResponse } from "../dto/event-attendee.dto";
import { EventAttendeeRoute } from "./event-attendee.acl";
import { EventRoute } from "./event.acl";

export const EventAttendeesRoute = new RouteEntity<Event, EventAttendeeResponse[]>({
  permissions: {
    vedouci: true,
  },
  linkTo: EventRoute,

  path: (e) => `${e.id}/attendees`,
  contains: {
    array: {
      entity: EventAttendeeRoute,
      properties: { member: { entity: MemberRoute }, event: { entity: EventRoute } },
    },
  },
});
