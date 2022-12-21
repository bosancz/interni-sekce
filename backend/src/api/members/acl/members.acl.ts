import { AcEntity } from "src/access-control/schema/ac-entity";
import { Member } from "src/models/members/entities/member.entity";
import { Roles } from "src/shared/schema/roles";

export const MembersACL: AcEntity<Roles, Member> = {
  permissions: {
    vedouci: true,
    clen: true,
  },
};

export const MemberACL: AcEntity<Roles, Member> = {
  permissions: {
    vedouci: true,
    clen: true,
  },
};
