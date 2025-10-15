export type UserRolesMetadata = {
	assignable: boolean;
	title: string;
};

export const UserRoles: { [role in BackendApiTypes.UserRolesEnum]: UserRolesMetadata } = {
	program: { assignable: true, title: "Správce programu" },
	revizor: { assignable: true, title: "Revizor" },
	admin: { assignable: true, title: "Administrátor" },
};
