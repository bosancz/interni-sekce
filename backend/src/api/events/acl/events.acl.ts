import { Request } from "express";
import { Permission } from "src/access-control/schema/route-acl";
import { RootResponse } from "src/api/root/dto/root-response";
import { Event, EventStates } from "src/models/events/entities/event.entity";
import { EventResponse } from "../dto/event.dto";

export const isMyEvent = (doc: Pick<Event, "attendees"> | undefined, req: Request) =>
	doc?.attendees?.some((l) => l.memberId === req.user?.memberId && l.type === "leader") ?? false;

export const EventsListRoute = new Permission({
	linkTo: RootResponse,
	contains: EventResponse,

	allowed: {
		vedouci: true,
	},
});

export const EventsYearsRoute = new Permission<void>({
	linkTo: EventResponse,
	allowed: {
		vedouci: true,
	},
});

export const EventReadRoute = new Permission({
	linkTo: EventResponse,
	contains: EventResponse,

	allowed: {
		vedouci: true,
	},
});

export const EventCreateRoute = new Permission<void>({
	linkTo: RootResponse,
	contains: EventResponse,

	allowed: {
		vedouci: true,
	},
});

export const EventEditRoute = new Permission({
	linkTo: EventResponse,

	allowed: {
		admin: true,
		program: true,
		vedouci: ({ doc, req }) => isMyEvent(doc, req),
	},

	applicable: (doc) => !doc.deletedAt,
});

export const EventDeleteRoute = new Permission({
	linkTo: EventResponse,
	allowed: {
		program: true,
		admin: true,
	},
	applicable: (doc) => doc.status !== EventStates.public && !doc.deletedAt,
});

export const EventRestoreRoute = new Permission({
	linkTo: EventResponse,
	allowed: {
		program: true,
		admin: true,
	},
	applicable: (doc) => !!doc.deletedAt,
});

export const EventLeadRoute = new Permission({
	linkTo: EventResponse,

	allowed: {
		admin: true,
		vedouci: true,
	},

	applicable: (doc) => (!doc.leaders || !doc.leaders.length) && !doc.deletedAt,
});

export const EventSubmitRoute = new Permission({
	linkTo: EventResponse,

	allowed: {
		admin: true,
		vedouci: ({ doc, req }) => isMyEvent(doc, req),
	},

	applicable: (doc) => doc.status === EventStates.draft && !doc.deletedAt,
});

export const EventPublishRoute = new Permission({
	linkTo: EventResponse,
	allowed: {
		program: true,
		admin: true,
	},
	applicable: (doc) => [EventStates.pending, EventStates.draft].includes(doc.status) && !doc.deletedAt,
});

export const EventRejectRoute = new Permission({
	linkTo: EventResponse,
	allowed: {
		program: true,
		admin: true,
	},
	applicable: (doc) => doc.status === EventStates.pending && !doc.deletedAt,
});

export const EventUnpublishRoute = new Permission({
	linkTo: EventResponse,
	allowed: {
		program: true,
		admin: true,
	},
	applicable: (doc) => doc.status === EventStates.public && !doc.deletedAt,
});

export const EventCancelRoute = new Permission({
	linkTo: EventResponse,
	allowed: {
		program: true,
		admin: true,
	},
	applicable: (doc) => doc.status === EventStates.public && !doc.deletedAt,
});

export const EventUncancelRoute = new Permission({
	linkTo: EventResponse,
	allowed: {
		program: true,
		admin: true,
	},
	applicable: (doc) => doc.status === EventStates.cancelled && !doc.deletedAt,
});

export const EventRegistrationReadRoute = new Permission({
	linkTo: EventResponse,

	inherit: EventReadRoute,
});

export const EventRegistrationEditRoute = new Permission({
	linkTo: EventResponse,

	inherit: EventEditRoute,
});

export const EventReportReadRoute = new Permission({
	linkTo: EventResponse,

	inherit: EventReadRoute,
});

export const EventReportEditRoute = new Permission({
	linkTo: EventResponse,

	inherit: EventEditRoute,
});
