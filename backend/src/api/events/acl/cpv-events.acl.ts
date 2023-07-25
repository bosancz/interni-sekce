import { RouteACL } from "src/access-control/schema/route-acl";
import { RootResponse } from "src/api/root/dto/root-response";
import { EventResponse } from "../dto/event.dto";

export const CPVEventsListRoute = new RouteACL<undefined, EventResponse[]>({
  linkTo: RootResponse,
  contains: EventResponse,

  permissions: {
    vedouci: true,
    verejnost: true,
  },
});
