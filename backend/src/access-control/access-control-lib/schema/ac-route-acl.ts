import { ForbiddenException, InternalServerErrorException, Type } from "@nestjs/common";
import { Request } from "express";
import { OptionsStore } from "../options-store";
import { EntityType } from "./entity-type";

export interface AcRouteOptions<DOC = void, ROLES extends string = string, PDATA extends Object = {}> {
	/** Add link for this route to the specified parent entity. This adds a links object as a property (default `_links`) to all routes of the same entity */
	linkTo?: Type<DOC extends void ? any : DOC>;

	/** Add links from child routes linked to this entity. This adds a links object as a property (default `_links`) to the response */
	contains?: EntityType;

	/** Permissions for the current route */
	allowed?: AcAllowed<DOC, ROLES, PDATA>;

	/** Inherit permissions of the specified entity */
	inherit?: AcPermission<DOC, ROLES>;

	/** Global condition whether this route is accessible (e.g. is document in the state to perform this operation) */
	applicable?: (d: DOC) => boolean;

	path?: (d: DOC) => string;

	name?: string;
}

export type AcAllowed<DOC, ROLES extends string = string, PDATA extends Object = {}> = Partial<
	Record<ROLES, AcAllowedValue<DOC, PDATA>>
>;

export type AcAllowedValue<DOC, PDATA extends Object = {}> =
	| boolean
	| AcAllowedFunction<DOC>
	| AcAllowedObject<DOC, PDATA>;
export type AcAllowedFunction<DOC> = (params: { doc: DOC; req: Request }) => boolean;
export type AcAllowedObject<DOC, PDATA> = {
	permission: boolean | AcAllowedFunction<DOC>;
} & PDATA;

export class AcPermission<DOC, ROLES extends string = string, PDATA extends Object = {}> {
	constructor(public options: AcRouteOptions<DOC, ROLES, PDATA>) {}

	canOrThrow(...args: DOC extends void ? [req: Request] : [req: Request, doc: DOC]) {
		if (!this.can(...args)) throw new ForbiddenException();
	}

	can(...args: DOC extends void ? [req: Request] : [req: Request, doc: DOC]) {
		const req = args[0];
		const doc = args[1];

		const permissions = this.getAllowed(req);

		if (!this.checkCondition(doc)) return false;

		return permissions.some((permission) => this.checkAllowed(permission, args[0], args[1]));
	}

	getAllowed(req: Request): AcAllowedValue<DOC, PDATA>[] {
		const userRoles = <ROLES[]>OptionsStore.getUserRoles(req);

		const permissions: AcAllowedValue<DOC, PDATA>[] = [];

		this.getInheritedPermissions().forEach((permission) => {
			userRoles.forEach((role) => {
				if (role in permission) permissions.push(permission[role]);
			});
		});

		return permissions;
	}

	getInheritedPermissions() {
		const permissions: Partial<Record<ROLES, AcAllowedValue<DOC, any>>>[] = [];
		if (this.options.inherit) permissions.push(...this.options.inherit.getInheritedPermissions());
		if (this.options.allowed) permissions.push(this.options.allowed);

		return permissions;
	}

	private checkAllowed(permission: AcAllowedValue<DOC>, req: Request, doc?: DOC) {
		try {
			// get permission from permission object
			let permissionValue = typeof permission === "object" ? permission.permission : permission;

			// permission specified globally
			if (typeof permissionValue === "boolean") return permissionValue;

			// permission specified per document
			if (typeof permissionValue === "function") {
				if (!doc) throw new InternalServerErrorException("Document must be provided for permission check.");
				return permissionValue({ doc, req });
			}
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

	private checkCondition(doc?: DOC) {
		if (typeof this.options.applicable === "function") {
			if (!doc) throw new InternalServerErrorException("Document must be provided for applicable check.");
			return this.options.applicable(doc);
		} else {
			return true;
		}
	}
}
