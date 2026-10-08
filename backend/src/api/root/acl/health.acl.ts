import { Permission } from "src/access-control/schema/route-acl";
import { HealthResponse } from "../dto/health-response";

export const HealthPermission = new Permission({
	contains: HealthResponse,

	allowed: {
		verejnost: true,
	},
});
