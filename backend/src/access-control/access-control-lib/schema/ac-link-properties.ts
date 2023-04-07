import { AcLink } from "./ac-link";

export type AcLinkProperties<P extends string> = { [key in P]: AcLink };
