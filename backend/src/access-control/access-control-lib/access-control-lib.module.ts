import { DynamicModule, Module } from "@nestjs/common";
import { OptionsStore } from "./options-store";
import { AccessControlLibOptions } from "./schema/options";

@Module({})
export class AccessControlLibModule {
  static register(options: AccessControlLibOptions): DynamicModule {
    Object.assign(OptionsStore, options);

    return {
      module: AccessControlLibModule,
    };
  }
}
