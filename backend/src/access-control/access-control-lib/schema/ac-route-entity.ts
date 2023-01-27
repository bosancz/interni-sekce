import { Request } from "express";

export interface AcRouteEntity<ROLES extends string = string, DOC = unknown, DATA = {}> {
  /** Permissions for the current route */
  permissions?: Partial<Record<ROLES, AcPermission<DOC, DATA>>>;

  /** Inherit permissions of the specified entity */
  inherits?: AcRouteEntity<ROLES, DOC>;

  /** Add link for this route to the specified parent entity */
  linkTo?: AcRouteEntity<ROLES, any>;
}

export type AcPermission<DOC, DATA = {}> = boolean | AcPermissionFunction<DOC> | AcPermissionObject<DOC, DATA>;

export type AcPermissionObject<DOC, DATA = {}> = AcFilter<DOC> & DATA;
export type AcPermissionFunction<DOC> = (params: { doc: DOC; req: Request }) => boolean;

export interface AcFilter<DOC> {
  /** Javascript function to filter array of documents */
  permission: boolean | AcPermissionFunction<DOC>;
}
