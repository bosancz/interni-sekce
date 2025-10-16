import { Module } from "@nestjs/common";
import { Request } from "express";
import { UserRoles } from "src/models/users/entities/user.entity";
import { AccessControlLibModule, AccessControlLibOptions } from "./access-control-lib";
import { Roles, StaticRoles } from "./schema/roles";

const acOptions: AccessControlLibOptions = {
	adminRole: UserRoles.admin,
	getUserRoles: (req: Request) => {
		// roles from the database
		const roles = new Set<Roles>(req.user?.roles ?? []);

		// default role for all users
		roles.add(StaticRoles.verejnost);

		// default role for registered users
		if (req.user) {
			roles.add(StaticRoles.vedouci);
			roles.add(StaticRoles.uzivatel);
		}

		return Array.from(roles);
	},
	routeNameConvention: (methodName) => methodName,
};

@Module({
	imports: [AccessControlLibModule.register(acOptions)],
	exports: [AccessControlLibModule],
})
export class AccessControlModule {}
