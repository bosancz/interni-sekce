import { ForbiddenException, Inject, Injectable, InternalServerErrorException, Logger } from "@nestjs/common";
import { Request } from "express";
import { AccessControlModuleOptions } from "../access-control.module";
import { AcEntity, AcPermission } from "../schema/ac-entity";

@Injectable()
export class AccessControlService {
  logger = new Logger(AccessControlService.name);

  constructor(@Inject("AC_OPTIONS") private options: AccessControlModuleOptions) {}

  canOrThrow<D = any>(entity: AcEntity<string, D>, doc: D, req: Request) {
    if (!this.can(entity, doc, req)) throw new ForbiddenException();
  }

  can<D>(entity: AcEntity<string, D>, doc: D, req: Request) {
    const permissions = this.getPermissions(entity, req);

    return permissions.some((permission) => this.checkPermission(permission, doc, req));
  }

  getPermissions<D, F>(entity: AcEntity<string, D, F>, req: Request): AcPermission<D, F>[] {
    const userRoles = this.options.userRoles(req);

    const roles = userRoles
      .map((role) => entity.permissions[role])
      .filter(<T>(role: T): role is Exclude<T, undefined> => role !== undefined);

    return roles;
  }

  private checkPermission<D>(permission: AcPermission<D>, doc: D, req: Request) {
    try {
      // permission specified globally
      if (typeof permission === "boolean") return permission;

      // permission specified per document
      if (typeof permission === "object") return permission.filter(doc, req);
    } catch (err) {
      if (err instanceof TypeError) throw new InternalServerErrorException(`Invalid document provided for validation. ${err.message}`);
      else {
        this.logger.error(err);
        throw new InternalServerErrorException("Permission validation error.");
      }
    }

    return false;
  }
}
