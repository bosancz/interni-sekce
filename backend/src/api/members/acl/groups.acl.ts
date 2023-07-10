import { RouteACL } from "src/access-control/schema/route-acl";
import { RootResponse } from "src/api/root/dto/root-response";
import { Group } from "src/models/members/entities/group.entity";
import { GroupResponse } from "../dto/group.dto";

export const GroupListRoute = new RouteACL<undefined, Group[]>({
  linkEntity: RootResponse,
  permissions: {
    vedouci: true,
  },
  contains: { array: { entity: GroupResponse } },
});

export const GroupCreateRoute = new RouteACL<undefined>({
  linkEntity: RootResponse,
  permissions: {
    admin: true,
  },
  contains: { entity: GroupResponse },
});

export const GroupReadRoute = new RouteACL<Group>({
  linkEntity: GroupResponse,
  permissions: {
    vedouci: true,
  },
});

export const GroupEditRoute = new RouteACL<Group>({
  linkEntity: GroupResponse,
  permissions: { admin: true },
});

export const GroupDeleteRoute = new RouteACL<Group>({
  linkEntity: GroupResponse,
  permissions: { admin: true },
});
