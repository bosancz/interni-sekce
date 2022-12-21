import { Request } from "express";

export interface AcEntity<ROLES extends string = string, DOC = any, DATA = {}> {
  permissions?: Partial<Record<ROLES, AcPermission<DOC, DATA>>>;
  parent?: AcEntity<ROLES>;
  inherits?: AcEntity<ROLES, DOC>;
}

export type AcPermission<DOC, DATA = {}> = boolean | AcPermissionFunction<DOC> | AcPermissionObject<DOC, DATA>;

export type AcPermissionObject<DOC, DATA = {}> = AcFilter<DOC> & DATA;
export type AcPermissionFunction<DOC> = (params: { doc: DOC; req: Request }) => boolean;

export interface AcFilter<DOC> {
  /** Javascript function to filter array of documents */
  permission: boolean | AcPermissionFunction<DOC>;
}
