import { Permission } from "src/access-control/schema/route-acl";
import { RootResponse } from "src/api/root/dto/root-response";

export const ChildDaysPermission = new Permission<void>({
	linkTo: RootResponse,

	allowed: {
		vedouci: true,
	},
});
