import { RouteACL } from "src/access-control/schema/route-acl";
import { RootResponse } from "../dto/root-response";

export const RootRoute = new RouteACL({
  linkEntity: RootResponse,

  permissions: {
    verejnost: true,
  },

  contains: { entity: RootResponse },
});
