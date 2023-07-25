import { RouteACL } from "src/access-control/schema/route-acl";
import { RootResponse } from "src/api/root/dto/root-response";

export const PadlersRankingRoute = new RouteACL({
  linkTo: RootResponse,

  permissions: {
    vedouci: true,
  },
});

export const PadlersTotalsRoute = new RouteACL({
  linkTo: RootResponse,

  permissions: {
    vedouci: true,
  },
});
