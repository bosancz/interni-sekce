import { Permission } from "src/access-control/schema/route-acl";
import { RootResponse } from "src/api/root/dto/root-response";
import { GroupResponse } from "../dto/group.dto";

export const GroupListPermission = new Permission<void>({
	linkTo: RootResponse,
	contains: GroupResponse,

	allowed: {
		vedouci: true,
	},
});

export const GroupCreatePermission = new Permission<void>({
	linkTo: RootResponse,
	contains: GroupResponse,

	allowed: {
		admin: true,
	},
});

export const GroupReadPermission = new Permission({
	linkTo: GroupResponse,
	contains: GroupResponse,

	allowed: {
		vedouci: true,
	},
});

export const GroupEditPermission = new Permission({
	linkTo: GroupResponse,

	allowed: { admin: true },
});

export const GroupDeletePermission = new Permission({
	linkTo: GroupResponse,

	allowed: { admin: true },
});
