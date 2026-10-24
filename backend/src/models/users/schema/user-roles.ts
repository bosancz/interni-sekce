export enum UserSavedRoles {
	"admin" = "admin",
	"revizor" = "revizor",
	"program" = "program",
	"pokladnik" = "pokladnik",
}

export enum UserDynamicRoles {
	"vedouci" = "vedouci",
	"uzivatel" = "uzivatel",
}

export const UserRoles = { ...UserSavedRoles, ...UserDynamicRoles };
export type UserRoles = UserSavedRoles | UserDynamicRoles;

export function isUserSavedRole(role: string): role is UserSavedRoles {
	return Object.values<string>(UserSavedRoles).includes(role);
}
