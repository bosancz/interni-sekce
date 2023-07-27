import { MembershipStatesEnum } from "../api";

export interface MembershipStatesMetadata {
  title: string;
}

export const MembershipStates: { [status in MembershipStatesEnum]: MembershipStatesMetadata } = {
  clen: {
    title: "Člen",
  },
  neclen: {
    title: "Nečlen",
  },
  pozastaveno: {
    title: "Pozastaveno",
  },
};
