import { RouteACL } from "src/access-control/schema/route-acl";
import { EventResponse } from "../dto/event.dto";

export const CPVEventsListRoute = new RouteACL<undefined, EventResponse[]>({
  permissions: {
    vedouci: true,
    verejnost: true,
  },
  contains: { array: { entity: EventResponse } },
});
