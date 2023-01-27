import { Module } from "@nestjs/common";
import { snakeCase } from "change-case";
import { Request } from "express";
import { AccessControlLibModule, AccessControlLibOptions } from "./access-control-lib/access-control-lib.module";

const acOptions: AccessControlLibOptions = {
  userRoles: (req: Request) => req.user?.roles || [],
  routeNameConvention: (methodName) => snakeCase(methodName).replace(/_/g, ":"),
};

@Module({
  imports: [AccessControlLibModule.register(acOptions)],
  exports: [AccessControlLibModule],
})
export class AccessControlModule {}
