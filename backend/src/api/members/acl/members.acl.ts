import { RouteACL } from "src/access-control/schema/route-acl";
import { RootResponse } from "src/api/root/dto/root-response";
import { Member } from "src/models/members/entities/member.entity";
import { MemberResponse } from "../dto/member.dto";

export const MembersRoute = new RouteACL<Member, Member[]>({
  entity: RootResponse,

  permissions: {
    vedouci: true,
  },
  contains: { array: { entity: MemberResponse } },
});

export const MemberCreateRoute = new RouteACL<undefined>({
  entity: MemberResponse,
  permissions: {
    vedouci: true,
  },
});

export const MemberRoute = new RouteACL<Member>({
  entity: MemberResponse,
  permissions: {
    vedouci: true,
  },
});

export const MemberUpdateRoute = new RouteACL<Member>({
  entity: MemberResponse,
  permissions: {
    vedouci: true,
  },
});

export const MemberDeleteRoute = new RouteACL<Member>({
  entity: MemberResponse,
  permissions: {
    vedouci: true,
  },
});
