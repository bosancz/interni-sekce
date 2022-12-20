import { Request } from "express";

export interface AcEntity<R extends string = string, DOC = any, FILTERS = {}> {
  permissions: Partial<Record<R, AcPermission<DOC, FILTERS>>>;
  parent?: AcEntity<R, DOC>;
}

export type AcPermission<DOC, FILTERS = {}> = boolean | AcPermissionObject<DOC, FILTERS>;

export type AcPermissionObject<DOC, FILTERS = {}> = AcFilter<DOC> & FILTERS;

export interface AcFilter<DOC> {
  /** Javascript function to filter array of documents */
  filter: (doc: DOC, req: Request) => boolean;
}
