import { MemberRolesEnum } from "../api";

export interface MemberRoleMetadata {
  title: string;
  genitiv: string;
}

export const MemberRoles: { [role in MemberRolesEnum]: MemberRoleMetadata } = {
  dite: {
    title: "dítě",
    genitiv: "dětí",
  },
  instruktor: {
    title: "instruktor",
    genitiv: "instruktorů",
  },
  vedouci: {
    title: "vedoucí",
    genitiv: "vedoucích",
  },
};
