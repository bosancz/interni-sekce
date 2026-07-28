import { Permission } from "src/access-control/schema/route-acl";
import { RootResponse } from "src/api/root/dto/root-response";
import { CPVEventResponse } from "../dto/cpv-event.dto";

export const CPVEventsListPermission = new Permission<void>({
	linkTo: RootResponse,
	// CPV events are read-only external entries with no operations of their own — link the list to
	// the root but do not attach Event's operations to each item (they don't apply here).
	contains: CPVEventResponse,

	allowed: {
		vedouci: true,
	},
});
