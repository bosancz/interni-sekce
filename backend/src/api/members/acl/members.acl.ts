import { AcEntity } from "src/access-control/schema/ac-entity";
import { Member } from "src/models/members/entities/member.entity";
import { Roles } from "src/shared/schema/roles";
import { AcWhereData } from "src/shared/util/ac-where";

export const MembersACL: AcEntity<Roles, any, AcWhereData> = {
  permissions: {
    vedouci: true,
    clen: true,
    verejnost: true,
  },
};

export const MemberACL: AcEntity<Roles, Member> = {
  permissions: {
    vedouci: true,
    clen: true,
    verejnost: true,
  },
};
