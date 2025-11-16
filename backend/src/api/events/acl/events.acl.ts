import { Request } from "express";
import { Permission } from "src/access-control/schema/route-acl";
import { RootResponse } from "src/api/root/dto/root-response";
import { Event, EventStates } from "src/models/events/entities/event.entity";
import { EventAttendeeResponse } from "../dto/event-attendee.dto";
import { EventExpenseResponse } from "../dto/event-expense.dto";
import { EventResponse } from "../dto/event.dto";

export const isMyEvent = (doc: Pick<Event, "attendees"> | undefined, req: Request) =>
	doc?.attendees?.some((l) => l.memberId === req.user?.memberId && l.type === "leader") ?? false;

export const EventsListPermission = new Permission({
	linkTo: RootResponse,
	contains: EventResponse,

	allowed: {
		vedouci: true,
	},
});

export const EventsYearsPermission = new Permission<void>({
	linkTo: EventResponse,
	allowed: {
		vedouci: true,
	},
});

export const EventReadPermission = new Permission({
	linkTo: EventResponse,
	contains: EventResponse,

	allowed: {
		vedouci: true,
	},
});

export const EventCreatePermission = new Permission<void>({
	linkTo: RootResponse,
	contains: EventResponse,

	allowed: {
		vedouci: true,
	},
});

export const EventEditPermission = new Permission({
	linkTo: EventResponse,

	allowed: {
		admin: true,
		program: true,
		vedouci: ({ doc, req }) => isMyEvent(doc, req),
	},

	applicable: ({ doc }) => !doc.deletedAt,
});

export const EventDeletePermission = new Permission({
	linkTo: EventResponse,
	allowed: {
		program: true,
		admin: true,
	},
	applicable: ({ doc }) => doc.status !== EventStates.public && !doc.deletedAt,
});

export const EventRestorePermission = new Permission({
	linkTo: EventResponse,
	allowed: {
		program: true,
		admin: true,
	},
	applicable: ({ doc }) => !!doc.deletedAt,
});

export const EventLeadPermission = new Permission({
	linkTo: EventResponse,

	allowed: {
		admin: true,
		vedouci: true,
	},

	applicable: ({ doc, req }) => (!doc.leaders || !doc.leaders.length) && !doc.deletedAt && !!req.user?.memberId,
});

export const EventSubmitPermission = new Permission({
	linkTo: EventResponse,

	allowed: {
		admin: true,
		vedouci: ({ doc, req }) => isMyEvent(doc, req),
	},

	applicable: ({ doc }) => doc.status === EventStates.draft && !doc.deletedAt,
});

export const EventPublishPermission = new Permission({
	linkTo: EventResponse,
	allowed: {
		program: true,
		admin: true,
	},
	applicable: ({ doc }) => [EventStates.pending, EventStates.draft].includes(doc.status) && !doc.deletedAt,
});

export const EventRejectPermission = new Permission({
	linkTo: EventResponse,
	allowed: {
		program: true,
		admin: true,
	},
	applicable: ({ doc }) => doc.status === EventStates.pending && !doc.deletedAt,
});

export const EventUnpublishPermission = new Permission({
	linkTo: EventResponse,
	allowed: {
		program: true,
		admin: true,
	},
	applicable: ({ doc }) => doc.status === EventStates.public && !doc.deletedAt,
});

export const EventCancelPermission = new Permission({
	linkTo: EventResponse,
	allowed: {
		program: true,
		admin: true,
	},
	applicable: ({ doc }) => doc.status === EventStates.public && !doc.deletedAt,
});

export const EventUncancelPermission = new Permission({
	linkTo: EventResponse,
	allowed: {
		program: true,
		admin: true,
	},
	applicable: ({ doc, req }) => doc.status === EventStates.cancelled && !doc.deletedAt,
});

export const EventRegistrationReadPermission = new Permission({
	linkTo: EventResponse,

	inherit: EventReadPermission,
});

export const EventRegistrationEditPermission = new Permission({
	linkTo: EventResponse,

	inherit: EventEditPermission,
});

export const EventRegistrationDeletePermission = new Permission({
	linkTo: EventResponse,

	inherit: EventEditPermission,
});

export const EventReportReadPermission = new Permission({
	linkTo: EventResponse,

	inherit: EventReadPermission,
});

export const EventReportEditPermission = new Permission({
	linkTo: EventResponse,

	inherit: EventEditPermission,
});

export const EventAnnouncementGetPermission = new Permission({
	linkTo: EventResponse,

	allowed: {
		admin: true,
		vedouci: ({ doc, req }) => isMyEvent(doc, req),
	},
});

export const EventExpensesListPermission = new Permission({
	linkTo: EventResponse,
	contains: EventExpenseResponse,

	inherit: EventReadPermission,

	path: (e) => `${e.id}/attendees`,
});

export const EventExpenseReadPermission = new Permission({
	linkTo: EventExpenseResponse,
	allowed: {
		vedouci: true,
	},
});

export const EventExpenseCreatePermission = new Permission({
	linkTo: EventResponse,
	contains: EventExpenseResponse,

	allowed: {
		vedouci: ({ doc, req }) => isMyEvent(doc, req),
	},
});

export const EventExpenseEditPermission = new Permission({
	linkTo: EventExpenseResponse,

	allowed: {
		admin: true,
		vedouci: ({ doc, req }) => isMyEvent(doc.event, req),
	},

	path: (d) => `${d.eventId}/expenses/${d.id}`,
});

export const EventExpenseDeletePermission = new Permission({
	linkTo: EventExpenseResponse,
	path: (d) => `${d.eventId}/expenses/${d.id}`,
	inherit: EventExpenseEditPermission,
});

export const EventAttendeesListPermission = new Permission({
	linkTo: EventResponse,
	contains: EventAttendeeResponse,

	inherit: EventReadPermission,

	path: (e) => `${e.id}/attendees`,
});

export const EventAttendeeReadPermission = new Permission({
	linkTo: EventAttendeeResponse,
	allowed: {
		vedouci: true,
	},
});

export const EventAttendeeCreatePermission = new Permission({
	linkTo: EventResponse,

	allowed: {
		admin: true,
		vedouci: ({ doc, req }) => isMyEvent(doc, req),
	},
});

export const EventAttendeeEditPermission = new Permission({
	linkTo: EventAttendeeResponse,

	allowed: {
		admin: true,
		vedouci: ({ doc, req }) => isMyEvent(doc.event, req),
	},

	path: (d) => `${d.eventId}/attendees/${d.memberId}`,
});

export const EventAttendeeDeletePermission = new Permission({
	linkTo: EventAttendeeResponse,
	path: (e) => `${e.eventId}/attendees/${e.memberId}`,
	inherit: EventAttendeeEditPermission,
});
