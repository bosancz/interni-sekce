import { RouteACL } from "src/access-control/schema/route-acl";
import { RootResponse } from "src/api/root/dto/root-response";
import { Member } from "src/models/members/entities/member.entity";
import { MemberResponse } from "../dto/member.dto";

export const MembersListRoute = new RouteACL<undefined>({
  linkTo: RootResponse,
  contains: MemberResponse,

  permissions: {
    vedouci: true,
  },
});

export const MembersExportRoute = new RouteACL<undefined>({
  linkTo: RootResponse,
  inheritPermissions: MembersListRoute,
});

export const MemberCreateRoute = new RouteACL<undefined>({
  linkTo: MemberResponse,
  permissions: {
    vedouci: true,
  },
});

export const MemberReadRoute = new RouteACL<Member>({
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
