import { FindOptionsWhere } from "typeorm";
import { AccessControlDocsParams, AccessControlRouteParams } from "./access-control-params";
import { Roles } from "./roles";

export interface AccessControlObject<D = any> {
  route: boolean | ((params: AccessControlRouteParams<D>) => boolean);
  docs?: boolean | ((params: AccessControlDocsParams<D>) => boolean);
  filter?: (params: AccessControlDocsParams<D>) => FindOptionsWhere<D>;
}

export type AccessControlRole<D = any> = boolean | AccessControlObject<D>;

export type AccessControlEntity<D = any> = Record<Roles, AccessControlRole<D>>;
