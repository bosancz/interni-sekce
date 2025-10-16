import { Permission } from "src/access-control/schema/route-acl";
import { RootResponse } from "src/api/root/dto/root-response";
import { MemberResponse } from "../dto/member.dto";

export const MembersListRoute = new Permission<void>({
	linkTo: RootResponse,
	contains: MemberResponse,

	allowed: {
		vedouci: true,
	},
});

export const MembersExportRoute = new Permission<void>({
	linkTo: RootResponse,
	inherit: MembersListRoute,
});

export const MemberCreateRoute = new Permission<void>({
	linkTo: MemberResponse,
	allowed: {
		vedouci: true,
	},
});

export const MemberReadRoute = new Permission({
	linkTo: MemberResponse,
	contains: MemberResponse,

	allowed: {
		vedouci: true,
	},
});

export const MemberUpdateRoute = new Permission({
	linkTo: MemberResponse,
	allowed: {
		vedouci: true,
	},
});

export const MemberDeleteRoute = new Permission({
	linkTo: MemberResponse,
	allowed: {
		vedouci: true,
	},
});
