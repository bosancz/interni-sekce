import { RouteACL } from "src/access-control/schema/route-acl";
import { Group } from "src/models/members/entities/group.entity";
import { GroupResponse } from "../dto/group.dto";

export const GroupListRoute = new RouteACL<undefined, Group[]>({
  permissions: {
    vedouci: true,
  },
  contains: { array: { entity: GroupResponse } },
});

export const GroupReadRoute = new RouteACL<Group>({
  entity: GroupResponse,
  permissions: {
    vedouci: true,
  },
});

export const GroupEditRoute = new RouteACL<Group>({
  entity: GroupResponse,
  permissions: { admin: true },
});

export const GroupDeleteRoute = new RouteACL<Group>({
  entity: GroupResponse,
  permissions: { admin: true },
});
