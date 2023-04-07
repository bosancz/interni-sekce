import { Module } from "@nestjs/common";
import { Request } from "express";
import { AccessControlLibModule, AccessControlLibOptions } from "./access-control-lib/access-control-lib.module";
import { Roles, StaticRoles } from "./schema/roles";

const acOptions: AccessControlLibOptions = {
  getUserRoles: (req: Request) => {
    // roles from the database
    const roles: Roles[] = req.user?.roles ?? [];

    // default role for all users
    roles.push(StaticRoles.verejnost);

    // default role for registered users
    if (req.user) roles.push(StaticRoles.vedouci, StaticRoles.uzivatel);

    return roles;
  },
  routeNameConvention: (methodName) => methodName,
};

@Module({
  imports: [AccessControlLibModule.register(acOptions)],
  exports: [AccessControlLibModule],
})
export class AccessControlModule {}
