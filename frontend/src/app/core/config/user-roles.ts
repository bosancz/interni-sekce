import { SDK } from "src/sdk";

export type UserRolesMetadata = {
	assignable: boolean;
	shown: boolean;
	title: string;
};

export const UserRoles: { [role in SDK.UserRolesEnum]: UserRolesMetadata } = {
	vedouci: { assignable: false, shown: true, title: "Vedoucí" },
	program: { assignable: true, shown: true, title: "Správce programu" },
	pokladnik: { assignable: true, shown: true, title: "Pokladník" },
	revizor: { assignable: true, shown: true, title: "Revizor" },
	admin: { assignable: true, shown: true, title: "Administrátor" },
	uzivatel: { assignable: false, shown: false, title: "Uživatel" },
};

export const AssignableUserRoles = Object.fromEntries(
	Object.entries(UserRoles).filter(([, role]) => role.assignable),
) as { [role in SDK.UserSavedRolesEnum]: UserRolesMetadata };

export const ShownUserRoles = Object.fromEntries(Object.entries(UserRoles).filter(([, role]) => role.shown)) as {
	[role in SDK.UserRolesEnum]?: UserRolesMetadata;
};

export function getAssignedRoles(roles: SDK.UserRolesEnum[] | null | undefined): SDK.UserSavedRolesEnum[] {
	return (roles ?? []).filter((role): role is SDK.UserSavedRolesEnum => UserRoles[role].assignable);
}

export function getShownRoles(roles: SDK.UserRolesEnum[] | null | undefined): SDK.UserRolesEnum[] {
	return (Object.keys(ShownUserRoles) as SDK.UserRolesEnum[]).filter((role) => roles?.includes(role));
}
