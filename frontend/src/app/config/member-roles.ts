import { SDK } from "src/sdk";

export interface MemberRoleMetadata {
  title: string;
  genitiv: string;
  code?: string;
}

export const MemberRoles: { [role in SDK.MemberRolesEnum]: MemberRoleMetadata } = {
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
