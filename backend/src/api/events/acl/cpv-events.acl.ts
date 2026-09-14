import { Permission } from "src/access-control/schema/route-acl";
import { RootResponse } from "src/api/root/dto/root-response";
import { CPVEventResponse } from "../dto/cpv-event.dto";

export const CPVEventsListPermission = new Permission<void>({
	linkTo: RootResponse,
	contains: CPVEventResponse,

	allowed: {
		vedouci: true,
	},
});
