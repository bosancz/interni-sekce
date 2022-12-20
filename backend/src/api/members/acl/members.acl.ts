import { AcEntity } from "src/access-control/schema/ac-entity";
import { Roles } from "src/api/events/acl/events.acl";
import { Member } from "src/models/members/entities/member.entity";

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
