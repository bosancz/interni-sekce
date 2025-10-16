import { Permission } from "src/access-control/schema/route-acl";
import { EventAttendeeResponse } from "../dto/event-attendee.dto";
import { EventResponse } from "../dto/event.dto";
import { EventReadRoute, isMyEvent } from "./events.acl";

export const EventAttendeesListRoute = new Permission({
	linkTo: EventResponse,
	contains: EventAttendeeResponse,

	inherit: EventReadRoute,

	path: (e) => `${e.id}/attendees`,
});

export const EventAttendeeReadRoute = new Permission({
	linkTo: EventAttendeeResponse,
	allowed: {
		vedouci: true,
	},
});

export const EventAttendeeCreateRoute = new Permission({
	linkTo: EventResponse,
	contains: EventAttendeeResponse,

	allowed: {
		admin: true,
		vedouci: ({ doc, req }) => isMyEvent(doc, req),
	},
});

export const EventAttendeeEditRoute = new Permission({
	linkTo: EventAttendeeResponse,
	contains: EventAttendeeResponse,

	allowed: {
		admin: true,
		vedouci: ({ doc, req }) => isMyEvent(doc.event, req),
	},

	path: (d) => `${d.eventId}/attendees/${d.memberId}`,
});

export const EventAttendeeDeleteRoute = new Permission({
	linkTo: EventAttendeeResponse,
	path: (e) => `${e.eventId}/attendees/${e.memberId}`,
	inherit: EventAttendeeEditRoute,
});
