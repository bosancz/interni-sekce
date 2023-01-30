import { RouteEntity } from "src/access-control/schema/route-entity";
import { Event } from "src/models/events/entities/event.entity";
import { EventRoute } from "./event.acl";

export const EventsRoute = new RouteEntity<Event, Event[]>({
  permissions: {
    vedouci: true,
  },
  contains: { array: { entity: EventRoute } },
});
