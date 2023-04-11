import { AccessControlLibOptions } from "./schema/options";

export var OptionsStore: Required<AccessControlLibOptions> = {
  linksProperty: "_links",
  getUserRoles: () => [],
  routeNameConvention: (methodKey: string) => methodKey,
};
