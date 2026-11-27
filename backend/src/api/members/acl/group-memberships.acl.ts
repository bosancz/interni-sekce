import { Permission } from "src/access-control/schema/route-acl";
import { GroupMembershipResponse } from "../dto/group-membership.dto";
import { MemberResponse } from "../dto/member.dto";
import { MemberReadPermission, MemberUpdatePermission } from "./members.acl";

export const GroupMembershipsListPermission = new Permission({
	linkTo: MemberResponse,
	contains: GroupMembershipResponse,
	params: { memberId: "id" },
	inherit: MemberReadPermission,
});

export const GroupMembershipCreatePermission = new Permission({
	linkTo: MemberResponse,
	contains: GroupMembershipResponse,
	params: { memberId: "id" },
	inherit: MemberUpdatePermission,
});

export const GroupMembershipUpdatePermission = new Permission({
	linkTo: GroupMembershipResponse,
	contains: GroupMembershipResponse,
	params: { memberId: "memberId", membershipId: "id" },
	allowed: { vedouci: true },
});

export const GroupMembershipDeletePermission = new Permission({
	linkTo: GroupMembershipResponse,
	params: { memberId: "memberId", membershipId: "id" },
	allowed: { vedouci: true },
});
