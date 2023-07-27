import { UserRolesEnum } from "../api";

export type UserRolesMetadata = {
  assignable: boolean;
  title: string;
};

export const UserRoles: { [role in UserRolesEnum]: UserRolesMetadata } = {
  program: { assignable: true, title: "Správce programu" },
  revizor: { assignable: true, title: "Revizor" },
  admin: { assignable: true, title: "Administrátor" },
};
