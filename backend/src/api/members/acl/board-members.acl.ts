import { Permission } from "src/access-control/schema/route-acl";
import { RootResponse } from "src/api/root/dto/root-response";
import { BoardMemberResponse } from "../dto/board-member.dto";

export const BoardMembersListPermission = new Permission<void>({
	linkTo: RootResponse,
	contains: BoardMemberResponse,

	allowed: {
		vedouci: true,
	},
});

export const BoardMemberSavePermission = new Permission<void>({
	linkTo: RootResponse,
});

export const BoardMembersOrderPermission = new Permission<void>({
	linkTo: RootResponse,
});

export const BoardMemberDeletePermission = new Permission({
	linkTo: BoardMemberResponse,
	params: { memberId: "memberId" },
});
