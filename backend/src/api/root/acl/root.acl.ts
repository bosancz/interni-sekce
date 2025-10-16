import { Permission } from "src/access-control/schema/route-acl";
import { RootResponse } from "../dto/root-response";

export const RootPermission = new Permission({
	contains: RootResponse,

	allowed: {
		verejnost: true,
	},
});
