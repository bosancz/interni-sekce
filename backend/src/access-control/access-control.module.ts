import { DynamicModule, Module } from "@nestjs/common";
import { Request } from "express";
import { AccessControlService } from "./services/access-control.service";

export interface AccessControlModuleOptions {
  userRoles: (req: Request) => string[];
}

@Module({})
export class AccessControlModule {
  static register(options: AccessControlModuleOptions): DynamicModule {
    return {
      module: AccessControlModule,
      global: true,
      providers: [
        {
          provide: "AC_OPTIONS",
          useValue: options,
        },
        AccessControlService,
      ],
      exports: [AccessControlService],
    };
  }
}
