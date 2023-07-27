import { RouteACL } from "src/access-control/schema/route-acl";
import { Member } from "src/models/members/entities/member.entity";
import { MemberResponse } from "../dto/member.dto";
import { MemberReadRoute, MemberUpdateRoute } from "./members.acl";

export const MemberInsuranceCardReadRoute = new RouteACL<Member>({
  linkTo: MemberResponse,
  inheritPermissions: MemberReadRoute,
  condition: (member) => !!member.insuranceCardFile,
});

export const MemberInsuranceCardUploadRoute = new RouteACL<Member>({
  linkTo: MemberResponse,
  inheritPermissions: MemberUpdateRoute,
});

export const MemberInsuranceCardDeleteRoute = new RouteACL<Member>({
  linkTo: MemberResponse,
  inheritPermissions: MemberUpdateRoute,
  condition: (member) => !!member.insuranceCardFile,
});
