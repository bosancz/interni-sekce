import { ForbiddenException, InternalServerErrorException } from "@nestjs/common";
import { Request } from "express";
import { AcEntity } from "src/access-control/schema/ac-entity";
import { AccessControlService } from "src/access-control/services/access-control.service";
import { Brackets, ObjectLiteral, WhereExpressionBuilder } from "typeorm";

export type AcWhereData = {
  where: (qb: WhereExpressionBuilder, req: Request) => WhereExpressionBuilder;
};

export function acWhere<D extends ObjectLiteral>(acl: AccessControlService, entity: AcEntity<string, D, AcWhereData>, req: Request) {
  const permissions = acl.getPermissions(entity, req);

  if (permissions.some((p) => p === true)) return {};
  if (permissions.every((p) => p === false)) throw new ForbiddenException();

  return new Brackets((qb) => {
    permissions.reduce((acc, cur, i) => {
      if (typeof cur !== "object" || !("where" in cur)) throw new InternalServerErrorException("Invalid value in permissions.");

      const b = new Brackets((qb) => cur.where(qb, req));

      return qb.orWhere(b);
    }, qb);
  });
}
