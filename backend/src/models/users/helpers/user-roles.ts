import type { Member } from "src/models/members/entities/member.entity";
import { isUserSavedRole, UserRoles, UserDynamicRoles, UserSavedRoles } from "../schema/user-roles";

export function getUserRoles(
	roles: UserRoles[] | null,
	member: Pick<Member, "active"> | null | undefined,
): UserRoles[] {
	const result = new Set<UserRoles>(roles ?? []);

	result.add(UserDynamicRoles.uzivatel);

	if (member?.active) result.add(UserDynamicRoles.vedouci);

	return Array.from(result);
}

export function getSavedRoles(roles: UserRoles[]): UserSavedRoles[] {
	return roles.filter(isUserSavedRole);
}
