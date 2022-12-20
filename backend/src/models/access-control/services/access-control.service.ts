import { ForbiddenException, Injectable, InternalServerErrorException, Logger } from "@nestjs/common";
import { UserToken } from "src/models/auth/schema/user-token";
import { FindOptionsWhere } from "typeorm";
import { ACL } from "../access-control-list";
import { AccessControlRole } from "../schema/access-control-list";
import { Roles } from "../schema/roles";

@Injectable()
export class AccessControlService {
  logger = new Logger(AccessControlService.name);

  canOrThrow<D = any>(entity: string, doc: D, token: UserToken) {
    if (!this.can(entity, doc, token)) throw new ForbiddenException();
  }

  can<D = any>(entity: string, doc: D, user?: UserToken) {
    const acRole = this.getAcRole(entity, user);

    try {
      if (acRole === null) return false;

      if (typeof acRole === "boolean") return acRole;

      if (typeof acRole.permission === "boolean") return acRole.permission;

      if (typeof acRole.permission === "function") return acRole.permission({ doc, user });
    } catch (err) {
      this.logger.error(err);
      if (err instanceof TypeError) throw new InternalServerErrorException(`Invalid document provided for validation. ${err.message}`);
      else throw new InternalServerErrorException("Permission validation error.");
    }

    return false;
  }

  filter<D = any>(entity: string, user?: UserToken): FindOptionsWhere<D> | false {
    const acRole = this.getAcRole(entity, user);

    try {
      if (acRole === false || acRole === null) return false;

      if (acRole === true) return {};

      if (typeof acRole.filter === "function") return acRole.filter({ user });

      if (typeof acRole.filter === "object") return acRole.filter;
    } catch (err) {
      this.logger.error(err);
      throw new InternalServerErrorException("Permission validation error.");
    }

    return false;
  }

  private getAcRole(entity: string, token?: UserToken): AccessControlRole<any> | null {
    const role = this.getUserRole(token);
    if (!role || !ACL[entity]?.[role]) return null;

    return <AccessControlRole<any>>ACL[entity][role];
  }

  private getUserRole(token?: UserToken): Roles | null {
    return token?.role ?? Roles.verejnost;
  }
}
