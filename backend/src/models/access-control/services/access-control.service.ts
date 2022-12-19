import { ForbiddenException, Injectable } from "@nestjs/common";
import { FindOptionsWhere } from "typeorm";
import { ACL } from "../access-control-list";
import { AccessControlRole } from "../schema/access-control-list";
import { AccessControlDocsParams, AccessControlRouteParams } from "../schema/access-control-params";
import { Roles } from "../schema/roles";

@Injectable()
export class AccessControlService {
  canRoute(entity: keyof typeof ACL, role: Roles, params: AccessControlRouteParams) {
    const acRole = this.getAcRole(entity, role);

    try {
      if (typeof acRole === "boolean") return acRole;
      else if (typeof acRole.route === "boolean") return acRole.route;
      else if (typeof acRole.route === "function") return acRole.route(params);
    } catch (err) {
      if (err instanceof ForbiddenException) throw err;
      else if (err instanceof TypeError) throw new ForbiddenException(`Invalid document provided for validation. ${err.message}`);
      else throw new ForbiddenException("Permission validation error.");
    }
  }

  canDoc(entity: keyof typeof ACL, role: Roles, params: AccessControlDocsParams) {
    const acRole = this.getAcRole(entity, role);

    try {
      if (!this.canRoute(entity, role, params)) return false;

      if (typeof acRole === "boolean") return acRole;
      else if (typeof acRole.route === "boolean") return acRole.route;
      else if (typeof acRole.route === "function") return acRole.route(params);
    } catch (err) {
      if (err instanceof ForbiddenException) throw err;
      else if (err instanceof TypeError) throw new ForbiddenException(`Invalid document provided for validation. ${err.message}`);
      else throw new ForbiddenException("Permission validation error.");
    }
  }

  getFilter<D = any>(entity: keyof typeof ACL, role: Roles, params: AccessControlDocsParams<D>): FindOptionsWhere<D> {
    const acRole = this.getAcRole(entity, role);

    try {
      if (!this.canDoc(entity, role, params)) throw new ForbiddenException();
      if (acRole === false) throw new ForbiddenException();

      if (acRole === true) return {};
      else if (typeof acRole.filter === "function") return acRole.filter(params);
    } catch (err) {
      if (err instanceof ForbiddenException) throw err;
      else if (err instanceof TypeError) new ForbiddenException("Invalid document provided for validation.");
      else throw new ForbiddenException("Permission validation error.");
    }
  }

  private getAcRole(entity: string, role: Roles) {
    if (!ACL[entity]) throw new ForbiddenException("Access control not defined for this entity.");
    if (!ACL[entity][role]) throw new ForbiddenException("Access control not defined for this role.");

    return <AccessControlRole<any>>ACL[entity][role];
  }
}
