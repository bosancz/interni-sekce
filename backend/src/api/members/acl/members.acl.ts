import { RouteACL } from "src/access-control/schema/route-acl";
import { RootResponse } from "src/api/root/dto/root-response";
import { Member } from "src/models/members/entities/member.entity";
import { MemberResponse } from "../dto/member.dto";

export const MembersRoute = new RouteACL<Member, Member[]>({
  linkTo: RootResponse,
  contains: MemberResponse,

  permissions: {
    vedouci: true,
  },
});

export const MemberCreateRoute = new RouteACL<undefined>({
  linkTo: MemberResponse,
  permissions: {
    vedouci: true,
  },
});

export const MemberRoute = new RouteACL<Member>({
  contains: MemberResponse,

  permissions: {
    vedouci: true,
  },
});

export const MemberUpdateRoute = new RouteACL<Member>({
  linkTo: MemberResponse,
  permissions: {
    vedouci: true,
  },
});

export const MemberDeleteRoute = new RouteACL<Member>({
  linkTo: MemberResponse,
  permissions: {
    vedouci: true,
  },
});
