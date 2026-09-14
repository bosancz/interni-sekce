import { ForbiddenException, InternalServerErrorException, Type } from "@nestjs/common";
import { Request } from "express";
import { OptionsStore } from "../options-store";
import { EntityType } from "./entity-type";

export interface AcRouteOptions<DOC = void, ROLES extends string = string, PDATA extends Object = {}> {
	linkTo?: Type<DOC extends void ? any : DOC>;

	contains?: EntityType;

	allowed?: AcAllowed<DOC, ROLES, PDATA>;

	inherit?: AcPermission<DOC, ROLES>;

	applicable?: (params: { doc: DOC; req: Request }) => boolean;

	params?: { [param: string]: keyof DOC | ((doc: DOC) => string | number) };

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

		if (!this.checkApplicable(req, doc)) return false;

		const allowed = this.getAllowed(req);

		return allowed.some((permission) => this.checkAllowed(permission, args[0], args[1]));
	}

	getAllowed(req: Request): AcAllowedValue<DOC, PDATA>[] {
		const userRoles = <ROLES[]>OptionsStore.getUserRoles(req);

		const allowed: AcAllowedValue<DOC, PDATA>[] = [];

		this.getInheritedPermissions().forEach((permission) => {
			userRoles.forEach((role) => {
				if (role in permission) allowed.push(permission[role]);
			});
		});

		if (OptionsStore.adminRole && userRoles.includes(OptionsStore.adminRole as ROLES)) allowed.push(true);

		return allowed;
	}

	getInheritedPermissions() {
		const permissions: Partial<Record<ROLES, AcAllowedValue<DOC, any>>>[] = [];
		if (this.options.inherit) permissions.push(...this.options.inherit.getInheritedPermissions());
		if (this.options.allowed) permissions.push(this.options.allowed);

		return permissions;
	}

	private checkAllowed(permission: AcAllowedValue<DOC>, req: Request, doc?: DOC) {
		try {
			let permissionValue = typeof permission === "object" ? permission.permission : permission;

			if (typeof permissionValue === "boolean") return permissionValue;

			if (typeof permissionValue === "function") {
				if (!doc) throw new InternalServerErrorException("Document must be provided for permission check.");
				return permissionValue({ doc, req });
			}
		} catch (err) {
			if (err instanceof TypeError)
				throw new InternalServerErrorException(`Invalid document provided for validation. ${err.message}`);
			else {
				throw new InternalServerErrorException("Permission validation error.");
			}
		}

		return false;
	}

	private checkApplicable(req: Request, doc?: DOC) {
		if (typeof this.options.applicable === "function") {
			if (!doc) throw new InternalServerErrorException("Document must be provided for applicable check.");
			return this.options.applicable({ req, doc });
		} else {
			return true;
		}
	}
}
