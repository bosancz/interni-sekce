import { Module } from "@nestjs/common";
import { Request } from "express";
import { UserRoles } from "src/models/users/entities/user.entity";
import { AccessControlLibModule, AccessControlLibOptions } from "./access-control-lib";
import { Roles, StaticRoles } from "./schema/roles";

const acOptions: AccessControlLibOptions = {
	adminRole: UserRoles.admin,
	getUserRoles: (req: Request) => {
		const roles = new Set<Roles>(req.user?.roles ?? []);

		roles.add(StaticRoles.verejnost);

		if (req.user) {
			roles.add(StaticRoles.uzivatel);

			if (req.user.memberActive) roles.add(StaticRoles.vedouci);
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
