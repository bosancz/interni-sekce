import { AcPermission } from "src/access-control/access-control-lib/schema/ac-route-entity";
import { RouteEntity } from "src/access-control/schema/route-entity";
import { CanWhereData } from "src/access-control/util/can-where";
import { Group } from "src/models/members/entities/group.entity";

const onlyActiveGroups: AcPermission<Group, CanWhereData> = {
  permission: ({ doc }) => doc.active,
  where: (qb) => qb.where("active = TRUE"),
};

export const GroupListACL: RouteEntity<Group, CanWhereData> = {
  permissions: {
    vedouci: true,
  },
};

export const GroupReadACL: RouteEntity<Group> = {
  permissions: {
    vedouci: true,
  },
};

export const GroupEditACL: RouteEntity<Group> = {
  permissions: { admin: true },
  linkTo: GroupReadACL,
};

export const GroupDeleteACL: RouteEntity<Group> = {
  permissions: { admin: true },
  linkTo: GroupReadACL,
};
