import { ForbiddenException } from "@nestjs/common";
import { Request } from "express";
import { Brackets, WhereExpressionBuilder } from "typeorm";
import { AcPermission } from "../access-control-lib/schema/ac-route-acl";
import { Roles } from "./roles";

/**
 * A row-level filter attached to a role permission. `alias` is the query builder alias of the
 * entity being listed (e.g. `"events"`), so the WHERE clause can reference the right columns
 * regardless of which query builder the permission is applied to.
 */
export type WhereData = {
	where?: (qb: WhereExpressionBuilder, req: Request, alias: string) => WhereExpressionBuilder;
};

export class Permission<DOC> extends AcPermission<DOC, Roles, WhereData> {
	/**
	 * Builds the WHERE condition that restricts a list query to the rows the current user is
	 * allowed to see. It both authorizes the request (throws {@link ForbiddenException} when the
	 * user has no matching permission) and returns the row filter to feed into a TypeORM query.
	 *
	 * Pass it straight to a query builder's `.where(...)` / `.andWhere(...)`. When the user may see
	 * everything it returns the always-true `"1=1"` condition, which TypeORM treats as a no-op.
	 *
	 * @param req current request (used to resolve roles and evaluate per-role `where` functions)
	 * @param alias the query builder alias of the listed entity, forwarded to each `where` clause
	 * @returns the always-true `"1=1"` string (no restriction / see everything) or a {@link Brackets}
	 *   OR-ing the `where` clauses of every matching permission
	 */
	canWhere(req: Request, alias: string): Brackets | string {
		const permissions = this.getAllowed(req);

		if (permissions.some((p) => p === true)) return "1=1";
		if (!permissions.length || permissions.every((p) => p === false)) throw new ForbiddenException();

		return new Brackets((qb) => {
			permissions.reduce((acc, cur) => {
				if (typeof cur === "object" && cur.where) {
					return acc.orWhere(new Brackets((qb) => cur.where!(qb, req, alias)));
				} else {
					return acc;
				}
			}, qb);
		});
	}
}
