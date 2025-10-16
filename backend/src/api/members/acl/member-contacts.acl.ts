import { Permission } from "src/access-control/schema/route-acl";
import { MemberContactResponse } from "../dto/member-contact.dto";
import { MemberResponse } from "../dto/member.dto";
import { MemberReadPermission, MemberUpdatePermission } from "./members.acl";

export const MemberContactsListPermission = new Permission({
	linkTo: MemberResponse,
	contains: MemberContactResponse,
	inherit: MemberReadPermission,
});

export const MemberContactsCreatePermission = new Permission({
	linkTo: MemberResponse,
	contains: MemberContactResponse,
	inherit: MemberUpdatePermission,
});

export const MemberContactsUpdatePermission = new Permission({
	linkTo: MemberResponse,
	contains: MemberContactResponse,
	inherit: MemberUpdatePermission,
});

export const MemberContactsDeletePermission = new Permission({
	linkTo: MemberContactResponse,
	allowed: { vedouci: true },
});
