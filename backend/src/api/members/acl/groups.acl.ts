import { AcEntity, AcPermission } from "src/access-control/schema/ac-entity";
import { Group } from "src/models/members/entities/group.entity";
import { Roles } from "src/shared/schema/roles";
import { AcWhereData } from "src/shared/util/ac-where";

const onlyActiveGroups: AcPermission<Group, AcWhereData> = {
  permission: ({ doc }) => doc.active,
  where: (qb) => qb.where("active = TRUE"),
};

export const GroupListACL: AcEntity<Roles, Group, AcWhereData> = {
  permissions: {
    clen: true,
    vedouci: true,
    verejnost: onlyActiveGroups,
  },
};

export const GroupReadACL: AcEntity<Roles, Group> = {
  permissions: {
    clen: true,
    vedouci: true,
    verejnost: onlyActiveGroups,
  },
};

export const GroupEditACL: AcEntity<Roles, Group> = {
  permissions: { admin: true },
  parent: GroupReadACL,
};

export const GroupDeleteACL: AcEntity<Roles, Group> = {
  permissions: { admin: true },
  parent: GroupReadACL,
};
