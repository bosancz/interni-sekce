import { Permission } from "src/access-control/schema/route-acl";
import { RootResponse } from "src/api/root/dto/root-response";
import { MemberResponse } from "../dto/member.dto";

export const MembersListPermission = new Permission<void>({
	linkTo: RootResponse,
	contains: MemberResponse,

	allowed: {
		vedouci: true,
	},
});

export const MembersExportPermission = new Permission<void>({
	linkTo: RootResponse,
	inherit: MembersListPermission,
});

export const MemberCreatePermission = new Permission<void>({
	linkTo: MemberResponse,
	allowed: {
		vedouci: true,
	},
});

export const MemberReadPermission = new Permission({
	linkTo: MemberResponse,
	contains: MemberResponse,

	allowed: {
		vedouci: true,
	},
});

export const MemberUpdatePermission = new Permission({
	linkTo: MemberResponse,
	allowed: {
		vedouci: true,
	},
});

export const MemberDeletePermission = new Permission({
	linkTo: MemberResponse,
	allowed: {
		vedouci: true,
	},
});
