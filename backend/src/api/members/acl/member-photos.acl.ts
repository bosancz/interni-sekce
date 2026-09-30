import { Permission } from "src/access-control/schema/route-acl";
import { PhotoResponse } from "src/api/albums/dto/photo.dto";
import { MemberRoles } from "src/models/members/entities/member.entity";
import { MemberResponse } from "../dto/member.dto";
import { MemberReadPermission } from "./members.acl";

export const MemberPhotosListPermission = new Permission({
	linkTo: MemberResponse,
	contains: PhotoResponse,
	params: { memberId: "id" },
	inherit: MemberReadPermission,
});

export const MemberProfilePhotoReadPermission = new Permission({
	linkTo: MemberResponse,
	params: { memberId: "id" },
	inherit: MemberReadPermission,
	applicable: ({ doc }) => !!doc.profilePhotoUpdatedAt,
});

export const MemberProfilePhotoUpdatePermission = new Permission({
	linkTo: MemberResponse,
	params: { memberId: "id" },
	allowed: {
		admin: true,
		vedouci: ({ doc, req }) => doc.role === MemberRoles.dite || doc.id === req.user?.memberId,
	},
	applicable: ({ doc }) => !doc.deletedAt,
});

export const MemberProfilePhotoDeletePermission = new Permission({
	linkTo: MemberResponse,
	params: { memberId: "id" },
	inherit: MemberProfilePhotoUpdatePermission,
	applicable: ({ doc }) => !!doc.profilePhotoUpdatedAt && !doc.deletedAt,
});
