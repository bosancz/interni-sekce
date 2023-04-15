import { RouteACL } from "src/access-control/schema/route-acl";
import { Event } from "src/models/events/entities/event.entity";
import { EventResponse } from "../dto/event.dto";
import { EventEditRoute, EventReadRoute } from "./events.acl";

export const EventRegistrationReadRoute = new RouteACL<Event>({
  entity: EventResponse,

  inheritPermissions: EventReadRoute,
});

export const EventRegistrationEditRoute = new RouteACL<Event>({
  entity: EventResponse,

  inheritPermissions: EventEditRoute,
});

export const EventRegistrationDeleteRoute = new RouteACL<Event>({
  entity: EventResponse,

  inheritPermissions: EventEditRoute,
});
