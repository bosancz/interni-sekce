import { Request } from "express";
import { AcEntity } from "src/access-control/schema/ac-entity";
import { AccessControlService } from "src/access-control/services/access-control.service";
import { ObjectLiteral } from "typeorm";
import { QueryFilter } from "../schema/query-filter";
import { permissionsToWhere } from "./permissions-to-where";

export function acWhere<D extends ObjectLiteral>(acl: AccessControlService, entity: AcEntity<string, D, QueryFilter>, req: Request) {
  const permissions = acl.getPermissions(entity, req);
  return permissionsToWhere(permissions, req);
}
