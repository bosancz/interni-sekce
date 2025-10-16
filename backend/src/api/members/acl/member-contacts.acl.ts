import { Permission } from "src/access-control/schema/route-acl";
import { MemberContactResponse } from "../dto/member-contact.dto";
import { MemberResponse } from "../dto/member.dto";
import { MemberReadRoute, MemberUpdateRoute } from "./members.acl";

export const MemberContactsListRoute = new Permission({
	linkTo: MemberResponse,
	contains: MemberContactResponse,
	inherit: MemberReadRoute,
});

export const MemberContactsCreateRoute = new Permission({
	linkTo: MemberResponse,
	contains: MemberContactResponse,
	inherit: MemberUpdateRoute,
});

export const MemberContactsUpdateRoute = new Permission({
	linkTo: MemberResponse,
	contains: MemberContactResponse,
	inherit: MemberUpdateRoute,
});

export const MemberContactsDeleteRoute = new Permission({
	linkTo: MemberContactResponse,
	allowed: { vedouci: true },
});
