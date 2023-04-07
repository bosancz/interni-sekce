import { AcLinkProperties } from "./ac-link-properties";

export type AcResponse<D, K extends string> = D & { _links: AcLinkProperties<K> };
