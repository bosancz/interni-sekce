import { FindOptionsWhere } from "typeorm";
import { AccessControlFilterParams, AccessControlPermissionParams } from "./access-control-params";
import { Roles } from "./roles";

export interface AccessControlObject<D = any> {
  permission: boolean | ((params: AccessControlPermissionParams<D>) => boolean);
  filter: FindOptionsWhere<D> | ((params: AccessControlFilterParams<D>) => FindOptionsWhere<D>);
}

export type AccessControlRole<D = any> = boolean | AccessControlObject<D>;

export type AccessControlEntity<D = any> = Partial<Record<Roles, AccessControlRole<D>>>;

export type AccessControlGroup<D = any> = Record<string, AccessControlEntity<D>>;
