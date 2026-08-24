import { Permission } from "src/access-control/schema/route-acl";
import { ChangelogResponse } from "../dto/changelog-response";

export const ChangelogPermission = new Permission({
	contains: ChangelogResponse,

	allowed: {
		verejnost: true,
	},
});
