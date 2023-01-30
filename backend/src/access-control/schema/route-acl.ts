import { ForbiddenException } from "@nestjs/common";
import { Request } from "express";
import { Brackets, WhereExpressionBuilder } from "typeorm";
import { AcRouteACL } from "../access-control-lib/schema/ac-route-acl";
import { DefaultRoles, Roles } from "./roles";

export type WhereData = { where?: (qb: WhereExpressionBuilder, req: Request) => WhereExpressionBuilder };

export class RouteACL<DOC, CONTAINS = DOC> extends AcRouteACL<DOC, CONTAINS, Roles, WhereData> {
  getUserRoles(req: Request) {
    // roles from the database
    const roles: Roles[] = req.user?.roles ?? [];

    // default role for all users
    roles.push(DefaultRoles.verejnost);

    // default role for registered users
    if (req.user) roles.push(DefaultRoles.vedouci);

    return roles;
  }

  /**
   * Functon that merges WHERE conditions from all permissions if defined
   * and returns them as Brackets object to use in the TypeORM query builder.
   * @param req
   * @returns
   */
  canWhere(req: Request) {
    const permissions = this.getPermissions(req);

    if (permissions.some((p) => p === true)) return {};
    if (permissions.every((p) => p === false)) throw new ForbiddenException();

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
