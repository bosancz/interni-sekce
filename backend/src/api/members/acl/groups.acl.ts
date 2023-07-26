import { RouteACL } from "src/access-control/schema/route-acl";
import { RootResponse } from "src/api/root/dto/root-response";
import { Group } from "src/models/members/entities/group.entity";
import { GroupResponse } from "../dto/group.dto";

export const GroupListRoute = new RouteACL<undefined>({
  linkTo: RootResponse,
  contains: GroupResponse,

  permissions: {
    vedouci: true,
  },
});

export const GroupCreateRoute = new RouteACL<undefined>({
  linkTo: RootResponse,
  contains: GroupResponse,

  permissions: {
    admin: true,
  },
});

export const GroupReadRoute = new RouteACL<Group>({
  linkTo: GroupResponse,
  contains: GroupResponse,

  permissions: {
    vedouci: true,
  },
});

export const GroupEditRoute = new RouteACL<Group>({
  linkTo: GroupResponse,

  permissions: { admin: true },
});

export const GroupDeleteRoute = new RouteACL<Group>({
  linkTo: GroupResponse,

  permissions: { admin: true },
});
