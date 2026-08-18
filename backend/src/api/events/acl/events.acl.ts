import { Request } from "express";
import { Permission } from "src/access-control/schema/route-acl";
import { RootResponse } from "src/api/root/dto/root-response";
import { Event, EventStates } from "src/models/events/entities/event.entity";
import { EventAttendeeResponse } from "../dto/event-attendee.dto";
import { EventExpenseResponse } from "../dto/event-expense.dto";
import { EventResponse } from "../dto/event.dto";

export const isMyEvent = (doc: Pick<Event, "attendees"> | undefined, req: Request) =>
	doc?.attendees?.some((l) => l.memberId === req.user?.memberId && l.type === "leader") ?? false;

export const EventsListPermission = new Permission<void>({
	linkTo: RootResponse,
	contains: EventResponse,

	allowed: {
		vedouci: true,
	},
});

export const EventsDeletedListPermission = new Permission<void>({
	linkTo: RootResponse,
	contains: EventResponse,

	// Anyone who can list events can also list deleted events (admin is always allowed implicitly).
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

export const EventsStatusesPermission = new Permission<void>({
	linkTo: EventResponse,
	allowed: {
		vedouci: true,
	},
});

export const EventReadPermission = new Permission({
	linkTo: EventResponse,
	contains: EventResponse,
	params: { eventId: "id" },

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
	params: { eventId: "id" },

	allowed: {
		program: true,
		vedouci: ({ doc, req }) => isMyEvent(doc, req),
	},

	applicable: ({ doc }) => !doc.deletedAt,
});

export const EventDeletePermission = new Permission({
	linkTo: EventResponse,
	params: { eventId: "id" },
	allowed: {
		program: true,
	},
	applicable: ({ doc }) => doc.status !== EventStates.public && !doc.deletedAt,
});

export const EventRestorePermission = new Permission({
	linkTo: EventResponse,
	params: { eventId: "id" },
	allowed: {
		program: true,
	},
	applicable: ({ doc }) => !!doc.deletedAt,
});

export const EventDeletePermanentPermission = new Permission({
	linkTo: EventResponse,
	params: { eventId: "id" },
	// Permanent deletion is irreversible and reserved for admins only.
	allowed: {
		admin: true,
	},
	applicable: ({ doc }) => !!doc.deletedAt,
});

export const EventLeadPermission = new Permission({
	linkTo: EventResponse,
	params: { eventId: "id" },

	allowed: {
		vedouci: true,
	},

	applicable: ({ doc, req }) => (!doc.leaders || !doc.leaders.length) && !doc.deletedAt && !!req.user?.memberId,
});

export const EventSubmitPermission = new Permission({
	linkTo: EventResponse,
	params: { eventId: "id" },

	allowed: {
		vedouci: ({ doc, req }) => isMyEvent(doc, req),
	},

	applicable: ({ doc }) => doc.status === EventStates.draft && !doc.deletedAt && !!doc.leaders?.length,
});

export const EventPublishPermission = new Permission({
	linkTo: EventResponse,
	params: { eventId: "id" },
	allowed: {
		program: true,
	},
	applicable: ({ doc }) =>
		[EventStates.pending, EventStates.draft].includes(doc.status) && !!doc.leaders?.length && !doc.deletedAt,
});

export const EventRejectPermission = new Permission({
	linkTo: EventResponse,
	params: { eventId: "id" },
	allowed: {
		program: true,
	},
	applicable: ({ doc }) => doc.status === EventStates.pending && !doc.deletedAt,
});

export const EventUnpublishPermission = new Permission({
	linkTo: EventResponse,
	params: { eventId: "id" },
	allowed: {
		program: true,
	},
	applicable: ({ doc }) => doc.status === EventStates.public && !doc.deletedAt,
});

export const EventCancelPermission = new Permission({
	linkTo: EventResponse,
	params: { eventId: "id" },
	allowed: {
		program: true,
	},
	applicable: ({ doc }) => doc.status === EventStates.public && !doc.deletedAt,
});

export const EventUncancelPermission = new Permission({
	linkTo: EventResponse,
	params: { eventId: "id" },
	allowed: {
		program: true,
	},
	applicable: ({ doc, req }) => doc.status === EventStates.cancelled && !doc.deletedAt,
});

export const EventRegistrationReadPermission = new Permission({
	linkTo: EventResponse,
	params: { eventId: "id" },

	inherit: EventEditPermission,
	applicable: ({ doc }) => doc.hasRegistration
});

export const EventRegistrationEditPermission = new Permission({
	linkTo: EventResponse,
	params: { eventId: "id" },

	inherit: EventEditPermission,
});

export const EventRegistrationGeneratePermission = new Permission({
	linkTo: EventResponse,
	params: { eventId: "id" },

	inherit: EventEditPermission,
	// The form prints the leader's name, phone and email — with no leader there is nothing to
	// generate, and EventRegistrationService.assertGeneratable() would reject it anyway.
	applicable: ({ doc }) => !!doc.attendees?.some((a) => a.type === "leader"),
});

export const EventRegistrationDeletePermission = new Permission({
	linkTo: EventResponse,
	params: { eventId: "id" },

	inherit: EventEditPermission,
	applicable: ({ doc }) => doc.hasRegistration
});

export const EventReportReadPermission = new Permission({
	linkTo: EventResponse,
	params: { eventId: "id" },

	inherit: EventReadPermission,
});

export const EventReportEditPermission = new Permission({
	linkTo: EventResponse,

	inherit: EventEditPermission,
});

export const EventAnnouncementGetPermission = new Permission({
	linkTo: EventResponse,
	params: { eventId: "id" },

	allowed: {
		revizor: true,
		vedouci: ({ doc, req }) => isMyEvent(doc, req),
	},
});

export const EventAccountingGetPermission = new Permission({
	linkTo: EventResponse,
	params: { eventId: "id" },

	allowed: {
		revizor: true,
		vedouci: ({ doc, req }) => isMyEvent(doc, req),
	},
});

export const EventExpensesListPermission = new Permission({
	linkTo: EventResponse,
	contains: EventExpenseResponse,
	params: { eventId: "id" },

	inherit: EventReadPermission,
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
	params: { eventId: "id" },

	allowed: {
		vedouci: ({ doc, req }) => isMyEvent(doc, req),
	},
});

export const EventExpenseEditPermission = new Permission({
	linkTo: EventExpenseResponse,
	params: { expenseId: "id" },

	allowed: {
		vedouci: ({ doc, req }) => isMyEvent(doc.event, req),
	},
});

export const EventExpenseDeletePermission = new Permission({
	linkTo: EventExpenseResponse,
	params: { expenseId: "id" },
	inherit: EventExpenseEditPermission,
});

export const EventAttendeesListPermission = new Permission({
	linkTo: EventResponse,
	contains: EventAttendeeResponse,
	params: { eventId: "id" },

	inherit: EventReadPermission,
});

export const EventAttendeeReadPermission = new Permission({
	linkTo: EventAttendeeResponse,
	allowed: {
		vedouci: true,
	},
});

export const EventAttendeeCreatePermission = new Permission({
	linkTo: EventResponse,
	params: { eventId: "id" },

	allowed: {
		vedouci: ({ doc, req }) => isMyEvent(doc, req),
	},
});

export const EventAttendeeEditPermission = new Permission({
	linkTo: EventAttendeeResponse,

	allowed: {
		vedouci: ({ doc, req }) => isMyEvent(doc.event, req),
	},
});

export const EventAttendeeDeletePermission = new Permission({
	linkTo: EventAttendeeResponse,
	inherit: EventAttendeeEditPermission,
});
