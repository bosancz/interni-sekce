import { ForbiddenException } from "@nestjs/common";
import { Request } from "express";
import { Brackets, WhereExpressionBuilder } from "typeorm";
import { AcPermission } from "../access-control-lib/schema/ac-route-acl";
import { Roles } from "./roles";

export type WhereData = {
	where?: (qb: WhereExpressionBuilder, req: Request, alias: string) => WhereExpressionBuilder;
};

export class Permission<DOC> extends AcPermission<DOC, Roles, WhereData> {
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
