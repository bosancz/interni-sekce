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

export const MembersDeletedListPermission = new Permission<void>({
	linkTo: RootResponse,
	contains: MemberResponse,

	allowed: {
		vedouci: true,
	},
});

export const MemberCreatePermission = new Permission<void>({
	linkTo: RootResponse,
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

/**
 * Changing the membership fee is the treasurer's job, so it is reserved for admins. This is the
 * only route that writes a membership payment (the member update body cannot carry one, and the
 * payments have no routes of their own), which is what makes the restriction hold everywhere
 * rather than just in the pages that happen to respect it.
 */
export const MemberMembershipUpdatePermission = new Permission({
	linkTo: MemberResponse,
	allowed: {
		admin: true,
	},
});

export const MemberDeletePermission = new Permission({
	linkTo: MemberResponse,
	allowed: {
		// A leader may delete only members of their own group; admin (implicit) may delete anyone.
		vedouci: ({ doc, req }) => req.user?.memberGroupId !== undefined && doc.groupId === req.user.memberGroupId,
	},
	applicable: ({ doc }) => !doc.deletedAt,
});

export const MemberRestorePermission = new Permission({
	linkTo: MemberResponse,
	// Restore mirrors delete: a leader may restore only members of their own group; admin anyone.
	allowed: {
		vedouci: ({ doc, req }) => req.user?.memberGroupId !== undefined && doc.groupId === req.user.memberGroupId,
	},
	applicable: ({ doc }) => !!doc.deletedAt,
});

export const MemberDeletePermanentPermission = new Permission({
	linkTo: MemberResponse,
	// Permanent deletion is irreversible and reserved for admins only.
	allowed: {
		admin: true,
	},
	applicable: ({ doc }) => !!doc.deletedAt,
});
