import { DynamicModule, Module } from "@nestjs/common";
import { Request } from "express";
import { AccessControlService } from "./services/access-control.service";

export interface AccessControlLibOptions {
  userRoles: (req: Request) => string[];
  routeNameConvention?: (methodName: string) => string;
}

@Module({})
export class AccessControlLibModule {
  static register(options: AccessControlLibOptions): DynamicModule {
    return {
      module: AccessControlLibModule,
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
