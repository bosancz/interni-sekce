import { ForbiddenException, InternalServerErrorException } from "@nestjs/common";
import { Request } from "express";
import { Brackets, ObjectLiteral, WhereExpressionBuilder } from "typeorm";
import { AccessControlService } from "../access-control-lib/services/access-control.service";
import { RouteEntity } from "../schema/route-entity";

export type CanWhereData = {
  where: (qb: WhereExpressionBuilder, req: Request) => WhereExpressionBuilder;
};

export function canWhere<D extends ObjectLiteral>(
  acService: AccessControlService,
  entity: RouteEntity<D, CanWhereData>,
  req: Request,
) {
  const permissions = acService.getPermissions(entity, req);

  if (permissions.some((p) => p === true)) return {};
  if (permissions.every((p) => p === false)) throw new ForbiddenException();

  return new Brackets((qb) => {
    permissions.reduce((acc, cur, i) => {
      if (typeof cur !== "object" || !("where" in cur))
        throw new InternalServerErrorException("Invalid value in permissions.");

      const b = new Brackets((qb) => cur.where(qb, req));

      return qb.orWhere(b);
    }, qb);
  });
}
