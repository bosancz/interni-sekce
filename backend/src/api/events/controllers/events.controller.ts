import {
	Body,
	ConflictException,
	Controller,
	Delete,
	Get,
	HttpCode,
	Logger,
	NotFoundException,
	Param,
	ParseIntPipe,
	Patch,
	Post,
	Query,
	Req,
	Res,
} from "@nestjs/common";
import { ApiResponse, ApiTags } from "@nestjs/swagger";
import { Request, Response } from "express";
import { AcController, AcLinks, WithLinks } from "src/access-control/access-control-lib";
import { Authenticated } from "src/auth/decorators/authenticated.decorator";
import { AuthUser } from "src/auth/decorators/auth-user.decorator";
import { SessionUser } from "src/auth/schema/user-token";
import { EventAttendeeType } from "src/models/events/entities/event-attendee.entity";
import { EventPlaceGeometry, EventStates } from "src/models/events/entities/event.entity";
import { EventsRepository, GetEventsOptions } from "src/models/events/repositories/events.repository";
import {
	EventCancelPermission,
	EventCreatePermission,
	EventDeletePermanentPermission,
	EventDeletePermission,
	EventEditPermission,
	EventLeadPermission,
	EventPublishPermission,
	EventReadPermission,
	EventRejectPermission,
	EventRestorePermission,
	EventsDeletedListPermission,
	EventsListPermission,
	EventsStatusesPermission,
	EventSubmitPermission,
	EventsYearsPermission,
	EventUncancelPermission,
	EventUnpublishPermission,
} from "../acl/events.acl";
import { EventCreateBody, EventResponse, EventStatusChangeBody, EventUpdateBody } from "../dto/event.dto";
import { ListEventsQuery } from "../dto/events.dto";

@Controller("events")
@Authenticated()
@AcController()
@ApiTags("Events")
export class EventsController {
	private logger = new Logger(EventsController.name);

	constructor(private events: EventsRepository) {}

	@Get()
	@AcLinks(EventsListPermission)
	@ApiResponse({ status: 200, type: WithLinks(EventResponse), isArray: true })
	async listEvents(
		@Req() req: Request,
		@AuthUser() authUser: SessionUser,
		@Query() query: ListEventsQuery,
	): Promise<EventResponse[]> {
		const where = EventsListPermission.canWhere(req, "events");

		const options: GetEventsOptions = {
			...query,
		};

		if (query.my) {
			if (!authUser.memberId)
				throw new ConflictException("Cannot show my events, user is not linked to a member.");
			options.memberId = authUser.memberId;
		}

		return this.events.getEvents(options, where);
	}

	@Post()
	@AcLinks(EventCreatePermission)
	@ApiResponse({ status: 201, type: EventResponse })
	async createEvent(
		@Req() req: Request,
		@Body() body: EventCreateBody,
		@Res({ passthrough: true }) res: Response,
	): Promise<Omit<EventResponse, "_links">> {
		EventCreatePermission.canOrThrow(req);

		res.status(201);
		return this.events.createEvent(body);
	}

	@Get("deleted")
	@AcLinks(EventsDeletedListPermission)
	@ApiResponse({ status: 200, type: WithLinks(EventResponse), isArray: true })
	async listDeletedEvents(@Req() req: Request): Promise<EventResponse[]> {
		EventsDeletedListPermission.canOrThrow(req);

		const where = EventsDeletedListPermission.canWhere(req, "events");

		return this.events.getDeletedEvents(where);
	}

	@Get("years")
	@AcLinks(EventsYearsPermission)
	@ApiResponse({ status: 200, schema: { type: "array", items: { type: "number" } } })
	async getEventsYears(@Req() req: Request): Promise<number[]> {
		EventsYearsPermission.canOrThrow(req);

		return this.events.getEventsYears();
	}

	@Get("statuses")
	@AcLinks(EventsStatusesPermission)
	@ApiResponse({ status: 200, schema: { type: "array", items: { type: "string" } } })
	async getEventsStatuses(@Req() req: Request): Promise<string[]> {
		EventsStatusesPermission.canOrThrow(req);

		return this.events.getEventsStatuses();
	}

	@Get(":eventId")
	@AcLinks(EventReadPermission)
	@ApiResponse({ status: 200, type: WithLinks(EventResponse) })
	async getEvent(@Req() req: Request, @Param("eventId", ParseIntPipe) eventId: number): Promise<EventResponse> {
		const event = await this.events.getEvent(eventId, { leaders: true });
		if (!event) throw new NotFoundException();

		EventReadPermission.canOrThrow(req, event);

		return event;
	}

	@Patch(":eventId")
	@HttpCode(204)
	@AcLinks(EventEditPermission)
	@ApiResponse({ status: 204 })
	async updateEvent(
		@Req() req: Request,
		@Param("eventId", ParseIntPipe) eventId: number,
		@Body() body: EventUpdateBody,
	): Promise<void> {
		const event = await this.events.getEvent(eventId, { leaders: true });
		if (!event) throw new NotFoundException();

		EventEditPermission.canOrThrow(req, event);

		const { placeCoordinates, ...eventData } = body;

		const placeGeometry: EventPlaceGeometry | null = placeCoordinates
			? { type: "Point", coordinates: [placeCoordinates.lng, placeCoordinates.lat] }
			: null;

		const updateData = {
			...eventData,
			placeGeometry,
		};

		await this.events.updateEvent(eventId, updateData);
	}

	@Delete(":eventId")
	@HttpCode(204)
	@AcLinks(EventDeletePermission)
	@ApiResponse({ status: 204 })
	async deleteEvent(@Req() req: Request, @Param("eventId", ParseIntPipe) eventId: number): Promise<void> {
		const event = await this.events.getEvent(eventId, { leaders: true });
		if (!event) throw new NotFoundException();

		EventDeletePermission.canOrThrow(req, event);

		return this.events.deleteEvent(eventId);
	}

	@Post(":eventId/restore")
	@HttpCode(204)
	@AcLinks(EventRestorePermission)
	@ApiResponse({ status: 204 })
	async restoreEvent(@Req() req: Request, @Param("eventId", ParseIntPipe) eventId: number): Promise<void> {
		const event = await this.events.getEvent(eventId, { leaders: true });
		if (!event) throw new NotFoundException();

		EventRestorePermission.canOrThrow(req, event);

		return this.events.restoreEvent(eventId);
	}

	@Delete(":eventId/permanent")
	@HttpCode(204)
	@AcLinks(EventDeletePermanentPermission)
	@ApiResponse({ status: 204 })
	async deleteEventPermanent(@Req() req: Request, @Param("eventId", ParseIntPipe) eventId: number): Promise<void> {
		const event = await this.events.getEvent(eventId, { leaders: true });
		if (!event) throw new NotFoundException();

		EventDeletePermanentPermission.canOrThrow(req, event);

		return this.events.hardDeleteEvent(eventId);
	}

	@Post(":eventId/lead")
	@HttpCode(204)
	@AcLinks(EventLeadPermission)
	@ApiResponse({ status: 204 })
	async leadEvent(
		@Req() req: Request,
		@Param("eventId", ParseIntPipe) eventId: number,
		@AuthUser() authUser: SessionUser,
	): Promise<void> {
		if (authUser.memberId === undefined) throw new ConflictException("User is not linked to a member.");

		const event = await this.events.getEvent(eventId, { leaders: true });
		if (!event) throw new NotFoundException();

		EventLeadPermission.canOrThrow(req, event);

		await this.events.createEventAttendee(eventId, authUser.memberId, { type: EventAttendeeType.leader });
	}

	@Post(":eventId/submit")
	@HttpCode(204)
	@AcLinks(EventSubmitPermission)
	@ApiResponse({ status: 204 })
	async submitEvent(
		@Req() req: Request,
		@Param("eventId", ParseIntPipe) eventId: number,
		@Body() body: EventStatusChangeBody,
	): Promise<void> {
		const event = await this.events.getEvent(eventId, { leaders: true });
		if (!event) throw new NotFoundException();

		EventSubmitPermission.canOrThrow(req, event);

		await this.events.updateEvent(eventId, { status: EventStates.pending, statusNote: body.statusNote });
	}

	@Post(":eventId/reject")
	@HttpCode(204)
	@AcLinks(EventRejectPermission)
	@ApiResponse({ status: 204 })
	async rejectEvent(
		@Req() req: Request,
		@Param("eventId", ParseIntPipe) eventId: number,
		@Body() body: EventStatusChangeBody,
	): Promise<void> {
		const event = await this.events.getEvent(eventId, { leaders: true });
		if (!event) throw new NotFoundException();

		EventRejectPermission.canOrThrow(req, event);

		await this.events.updateEvent(eventId, { status: EventStates.draft, statusNote: body.statusNote });
	}

	@Post(":eventId/publish")
	@HttpCode(204)
	@AcLinks(EventPublishPermission)
	@ApiResponse({ status: 204 })
	async publishEvent(
		@Req() req: Request,
		@Param("eventId", ParseIntPipe) eventId: number,
		@Body() body: EventStatusChangeBody,
	): Promise<void> {
		const event = await this.events.getEvent(eventId, { leaders: true });
		if (!event) throw new NotFoundException();

		EventPublishPermission.canOrThrow(req, event);

		await this.events.updateEvent(eventId, { status: EventStates.public, statusNote: body.statusNote });
	}

	@Post(":eventId/unpublish")
	@HttpCode(204)
	@AcLinks(EventUnpublishPermission)
	@ApiResponse({ status: 204 })
	async unpublishEvent(
		@Req() req: Request,
		@Param("eventId", ParseIntPipe) eventId: number,
		@Body() body: EventStatusChangeBody,
	): Promise<void> {
		const event = await this.events.getEvent(eventId, { leaders: true });
		if (!event) throw new NotFoundException();

		EventUnpublishPermission.canOrThrow(req, event);

		await this.events.updateEvent(eventId, { status: EventStates.draft, statusNote: body.statusNote });
	}

	@Post(":eventId/cancel")
	@HttpCode(204)
	@AcLinks(EventCancelPermission)
	@ApiResponse({ status: 204 })
	async cancelEvent(
		@Req() req: Request,
		@Param("eventId", ParseIntPipe) eventId: number,
		@Body() body: EventStatusChangeBody,
	): Promise<void> {
		const event = await this.events.getEvent(eventId, { leaders: true });
		if (!event) throw new NotFoundException();

		EventCancelPermission.canOrThrow(req, event);

		await this.events.updateEvent(eventId, { status: EventStates.cancelled, statusNote: body.statusNote });
	}

	@Post(":eventId/uncancel")
	@HttpCode(204)
	@AcLinks(EventUncancelPermission)
	@ApiResponse({ status: 204 })
	async uncancelEvent(
		@Req() req: Request,
		@Param("eventId", ParseIntPipe) eventId: number,
		@Body() body: EventStatusChangeBody,
	): Promise<void> {
		const event = await this.events.getEvent(eventId, { leaders: true });
		if (!event) throw new NotFoundException();

		EventUncancelPermission.canOrThrow(req, event);

		await this.events.updateEvent(eventId, { status: EventStates.public, statusNote: body.statusNote });
	}
}
