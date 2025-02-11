import { SDK } from "src/sdk";

export type UserRolesMetadata = {
  assignable: boolean;
  title: string;
};

export const UserRoles: { [role in SDK.UserRolesEnum]: UserRolesMetadata } = {
  program: { assignable: true, title: "Správce programu" },
  revizor: { assignable: true, title: "Revizor" },
  admin: { assignable: true, title: "Administrátor" },
};
