import { Module } from "@nestjs/common";
import { UserSavedRoles } from "src/models/users/schema/user-roles";
import { Request } from "express";
import { AccessControlLibModule, AccessControlLibOptions } from "./access-control-lib";

const acOptions: AccessControlLibOptions = {
	adminRole: UserSavedRoles.admin,
	getUserRoles: (req: Request) => {
		return req.user?.roles ?? [];
	},
	routeNameConvention: (methodName) => methodName,
};

@Module({
	imports: [AccessControlLibModule.register(acOptions)],
	exports: [AccessControlLibModule],
})
export class AccessControlModule {}
