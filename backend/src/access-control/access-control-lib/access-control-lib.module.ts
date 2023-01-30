import { DynamicModule, Module } from "@nestjs/common";
import { Request } from "express";

export interface AccessControlLibOptions {
  userRoles: (req: Request) => string[];
  routeNameConvention?: (methodName: string) => string;
}

export const AcOptions = Symbol("AC_OPTIONS");

@Module({})
export class AccessControlLibModule {
  static register(options: AccessControlLibOptions): DynamicModule {
    return {
      module: AccessControlLibModule,
      global: true,
      providers: [
        {
          provide: AcOptions,
          useValue: options,
        },
      ],
      exports: [AcOptions],
    };
  }
}
