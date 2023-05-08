import { ForbiddenException, InternalServerErrorException } from "@nestjs/common";
import { Request } from "express";
import { OptionsStore } from "../options-store";
import { AcEntity } from "./ac-entity";
import { ChildEntity } from "./child-entity";

export interface AcRouteOptions<DOC, CONTAINS = DOC, ROLES extends string = string, PDATA extends Object = {}> {
  // TODO: maybe rename to `linkTo`
  /** Add link for this route to the specified parent entity. This adds a links object as a property (default `_links`) to all routes of the same entity */
  linkEntity?: AcEntity<DOC>;

  // TODO: maybe rename to `allowed` like the resulting property
  /** Permissions for the current route */
  permissions?: AcPermissions<DOC, ROLES, PDATA>;

  /** Inherit permissions of the specified entity */
  inheritPermissions?: AcRouteACL<DOC, any, ROLES>;

  // TODO: maybe rename to `applicable` like the resulting property
  /** Global condition whether this route is accessible (i.e. is document in the state to perform this operation) */
  condition?: (d: DOC) => boolean;

  path?: (d: DOC) => string;

  contains?: ChildEntity<CONTAINS>;

  name?: string;
}

export type AcPermissions<DOC, ROLES extends string = string, PDATA extends Object = {}> = Partial<
  Record<ROLES, AcPermission<DOC, PDATA>>
>;

export type AcPermission<DOC, PDATA extends Object = {}> =
  | boolean
  | AcPermissionFunction<DOC>
  | AcPermissionObject<DOC, PDATA>;
export type AcPermissionFunction<DOC> = (params: { doc: DOC; req: Request }) => boolean;
export type AcPermissionObject<DOC, PDATA> = {
  permission: boolean | AcPermissionFunction<DOC>;
} & PDATA;

export abstract class AcRouteACL<DOC, CONTAINS = DOC, ROLES extends string = string, PDATA extends Object = {}> {
  constructor(public options: AcRouteOptions<DOC, CONTAINS, ROLES, PDATA>) {}

  canOrThrow(req: Request, doc: DOC) {
    if (!this.can(req, doc)) throw new ForbiddenException();
  }

  can(req: Request, doc: DOC) {
    const permissions = this.getPermissions(req);

    if (!this.checkCondition(doc)) return false;

    return permissions.some((permission) => this.checkPermission(permission, doc, req));
  }

  getPermissions(req: Request): AcPermission<DOC, PDATA>[] {
    const userRoles = <ROLES[]>OptionsStore.getUserRoles(req);

    const permissions: AcPermission<DOC, PDATA>[] = [];

    this.getInheritedPermissions().forEach((permission) => {
      userRoles.forEach((role) => {
        if (role in permission) permissions.push(permission[role]);
      });
    });

    return permissions;
  }

  getInheritedPermissions() {
    const permissions: Partial<Record<ROLES, AcPermission<DOC, any>>>[] = [];
    if (this.options.inheritPermissions) permissions.push(...this.options.inheritPermissions.getInheritedPermissions());
    if (this.options.permissions) permissions.push(this.options.permissions);

    return permissions;
  }

  private checkPermission(permission: AcPermission<DOC>, doc: DOC, req: Request) {
    try {
      // get permission from permission object
      let permissionValue = typeof permission === "object" ? permission.permission : permission;

      // permission specified globally
      if (typeof permissionValue === "boolean") return permissionValue;

      // permission specified per document
      if (typeof permissionValue === "function") return permissionValue({ doc, req });
    } catch (err) {
      if (err instanceof TypeError)
        throw new InternalServerErrorException(`Invalid document provided for validation. ${err.message}`);
      else {
        // this.logger.error(err);
        throw new InternalServerErrorException("Permission validation error.");
      }
    }

    return false;
  }

  private checkCondition(doc: DOC) {
    if (typeof this.options.condition === "function") {
      return this.options.condition(doc);
    } else {
      return true;
    }
  }
}
