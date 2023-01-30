import { RouteEntity } from "src/access-control/schema/route-entity";
import { Group } from "src/models/members/entities/group.entity";

export const GroupReadRoute = new RouteEntity<Group>({
  permissions: {
    vedouci: true,
  },
});

export const GroupEditRoute = new RouteEntity<Group>({
  permissions: { admin: true },
  linkTo: GroupReadRoute,
});

export const GroupDeleteRoute = new RouteEntity<Group>({
  permissions: { admin: true },
  linkTo: GroupReadRoute,
});
