import { ForbiddenException } from "@nestjs/common";
import { Request } from "express";
import { Brackets, WhereExpressionBuilder } from "typeorm";
import { AcRouteACL } from "../access-control-lib";
import { Roles } from "./roles";

export type WhereData = { where?: (qb: WhereExpressionBuilder, req: Request) => WhereExpressionBuilder };

export class RouteACL<DOC> extends AcRouteACL<DOC, Roles, WhereData> {
  /**
   * Functon that merges WHERE conditions from all permissions if defined
   * and returns them as Brackets object to use in the TypeORM query builder.
   * @param req
   * @returns
   */
  canWhere(req: Request) {
    const permissions = this.getPermissions(req);

    if (permissions.some((p) => p === true)) return {};
    if (!permissions.length || permissions.every((p) => p === false)) throw new ForbiddenException();

    return new Brackets((qb) => {
      permissions.reduce((acc, cur, i) => {
        if (typeof cur === "object" && cur.where) {
          return acc.orWhere(new Brackets((qb) => cur.where!(qb, req)));
        } else {
          return acc;
        }
      }, qb);
    });
  }
}
