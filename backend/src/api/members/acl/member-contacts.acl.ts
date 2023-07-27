import { RouteACL } from "src/access-control/schema/route-acl";
import { Member } from "src/models/members/entities/member.entity";
import { MemberContactResponse } from "../dto/member-contact.dto";
import { MemberResponse } from "../dto/member.dto";
import { MemberReadRoute, MemberUpdateRoute } from "./members.acl";

export const MemberContactsListRoute = new RouteACL<Member>({
  linkTo: MemberResponse,
  contains: MemberContactResponse,
  inheritPermissions: MemberReadRoute,
});

export const MemberContactsCreateRoute = new RouteACL<Member>({
  linkTo: MemberResponse,
  contains: MemberContactResponse,
  inheritPermissions: MemberUpdateRoute,
});

export const MemberContactsDeleteRoute = new RouteACL<Member>({
  linkTo: MemberContactResponse,
  inheritPermissions: MemberUpdateRoute,
});
