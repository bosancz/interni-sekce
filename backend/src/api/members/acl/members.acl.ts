import { RouteEntity } from "src/access-control/schema/route-entity";
import { CanWhereData } from "src/access-control/util/can-where";
import { Member } from "src/models/members/entities/member.entity";

export const MembersACL: RouteEntity<Member, CanWhereData> = {
  permissions: {
    vedouci: true,
    verejnost: true,
  },
};

export const MemberACL: RouteEntity<Member> = {
  permissions: {
    vedouci: true,
    verejnost: true,
  },
};
