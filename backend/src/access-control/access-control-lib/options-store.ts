import { AccessControlLibOptions } from "./schema/options";

export var OptionsStore: RequiredBy<AccessControlLibOptions, "getUserRoles" | "linksProperty" | "routeNameConvention"> =
	{
		adminRole: undefined,
		linksProperty: "_links",
		getUserRoles: () => [],
		routeNameConvention: (methodKey: string) => methodKey,
	};
