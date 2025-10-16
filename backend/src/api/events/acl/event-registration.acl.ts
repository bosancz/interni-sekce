import { Permission } from "src/access-control/schema/route-acl";
import { EventResponse } from "../dto/event.dto";
import { EventEditRoute, EventReadRoute } from "./events.acl";

export const EventRegistrationReadRoute = new Permission({
	linkTo: EventResponse,

	inherit: EventReadRoute,
});

export const EventRegistrationEditRoute = new Permission({
	linkTo: EventResponse,

	inherit: EventEditRoute,
});

export const EventRegistrationDeleteRoute = new Permission({
	linkTo: EventResponse,

	inherit: EventEditRoute,
});
