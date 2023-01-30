import { RouteEntity } from "src/access-control/schema/route-entity";
import { Group } from "src/models/members/entities/group.entity";
import { GroupReadRoute } from "./group.acl";

export const GroupListRoute = new RouteEntity<undefined, Group[]>({
  permissions: {
    vedouci: true,
  },
  contains: { array: { entity: GroupReadRoute } },
});
