import { MemberRolesEnum } from "../api";

export interface MemberRoleMetadata {
  title: string;
  genitiv: string;
  code?: string;
}

export const MemberRoles: { [role in MemberRolesEnum]: MemberRoleMetadata } = {
  dite: {
    title: "dítě",
    genitiv: "dětí",
    code: "D",
  },
  instruktor: {
    title: "instruktor",
    genitiv: "instruktorů",
    code: "I",
  },
  vedouci: {
    title: "vedoucí",
    genitiv: "vedoucích",
    code: "V",
  },
};
