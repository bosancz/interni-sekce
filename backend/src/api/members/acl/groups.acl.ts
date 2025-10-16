import { Permission } from "src/access-control/schema/route-acl";
import { RootResponse } from "src/api/root/dto/root-response";
import { GroupResponse } from "../dto/group.dto";

export const GroupListRoute = new Permission<void>({
	linkTo: RootResponse,
	contains: GroupResponse,

	allowed: {
		vedouci: true,
	},
});

export const GroupCreateRoute = new Permission<void>({
	linkTo: RootResponse,
	contains: GroupResponse,

	allowed: {
		admin: true,
	},
});

export const GroupReadRoute = new Permission({
	linkTo: GroupResponse,
	contains: GroupResponse,

	allowed: {
		vedouci: true,
	},
});

export const GroupEditRoute = new Permission({
	linkTo: GroupResponse,

	allowed: { admin: true },
});

export const GroupDeleteRoute = new Permission({
	linkTo: GroupResponse,

	allowed: { admin: true },
});
