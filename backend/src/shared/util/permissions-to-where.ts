import { Request } from "express";
import { AcPermission } from "src/access-control/schema/ac-entity";
import { Brackets, ObjectLiteral } from "typeorm";
import { QueryFilter } from "../schema/query-filter";

export function permissionsToWhere<D extends ObjectLiteral>(permissions: AcPermission<D, QueryFilter>[], req: Request) {
  return new Brackets((qb) => {
    permissions.reduce((acc, cur, i) => {
      if (typeof cur !== "object") return acc;
      const b = new Brackets((qb) => cur.where(qb, req));
      return qb.orWhere(b);
    }, qb);
  });
}
