import { Permission } from "src/access-control/schema/route-acl";
import { RootResponse } from "src/api/root/dto/root-response";
import { EventResponse } from "../dto/event.dto";

export const CPVEventsListPermission = new Permission<void>({
	linkTo: RootResponse,
	contains: EventResponse,

	allowed: {
		vedouci: true,
		verejnost: true,
	},
});
