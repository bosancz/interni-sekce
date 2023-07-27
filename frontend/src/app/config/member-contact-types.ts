import { MemberContactTypesEnum } from "../api";

export interface MemberContactTypesMetadata {
  title: string;
}

export const MemberContactTypes: Record<MemberContactTypesEnum, MemberContactTypesMetadata> = {
  mobile: { title: "mobil" },
  email: { title: "e-mail" },
  other: { title: "jiný kontakt" },
};
