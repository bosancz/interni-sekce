import { DynamicModule, Module } from "@nestjs/common";
import { Request } from "express";
import { OptionsStore } from "./options-store";

export interface AccessControlLibOptions {
  getUserRoles: (req: Request) => string[];
  routeNameConvention?: (methodName: string) => string;
}

export const AcOptions = Symbol("AC_OPTIONS");

@Module({})
export class AccessControlLibModule {
  static register(options: AccessControlLibOptions): DynamicModule {
    Object.assign(OptionsStore, options);

    return {
      module: AccessControlLibModule,
    };
  }
}
