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
});

export const GroupReadPermission = new Permission({
	linkTo: GroupResponse,
	contains: GroupResponse,
	params: { groupId: "id" },

	allowed: {
		vedouci: true,
	},
});

export const GroupEditPermission = new Permission({
	linkTo: GroupResponse,
	params: { groupId: "id" },
});

export const GroupDeletePermission = new Permission({
	linkTo: GroupResponse,
	params: { groupId: "id" },

	applicable: ({ doc }) => !doc.deletedAt,
});

export const GroupRestorePermission = new Permission({
	linkTo: GroupResponse,
	params: { groupId: "id" },

	applicable: ({ doc }) => !!doc.deletedAt,
});

export const GroupPermanentDeletePermission = new Permission({
	linkTo: GroupResponse,
	params: { groupId: "id" },

	applicable: ({ doc }) => !!doc.deletedAt,
});
