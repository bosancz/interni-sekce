import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { PaginationOptions } from "src/helpers/pagination";
import { applySort } from "src/helpers/sort";
import { Group } from "src/models/members/entities/group.entity";
import { Brackets, FindOptionsSelect, Repository } from "typeorm";
import { EventAttendee, EventAttendeeType } from "../entities/event-attendee.entity";
import { EventExpense } from "../entities/event-expense.entity";
import { Event, EventStates } from "../entities/event.entity";

export interface GetEventsOptions extends PaginationOptions {
	year?: number[];
	status?: string[];
	search?: string;
	memberId?: number;
	noleader?: boolean;
	deleted?: boolean;
	dateFrom?: string;
	dateTill?: string;
}

@Injectable()
export class EventsRepository {
	constructor(
		@InjectRepository(Event) private eventsRepository: Repository<Event>,
		@InjectRepository(EventAttendee) private eventAttendeesRepository: Repository<EventAttendee>,
		@InjectRepository(EventExpense) private eventExpensesRepository: Repository<EventExpense>,
	) {}

	async getEvents(options: GetEventsOptions = {}, where: Brackets | string = "1=1") {
		const q = this.eventsRepository
			.createQueryBuilder("events")
			.select([
				"events.id",
				"events.name",
				"events.status",
				"events.statusNote",
				"events.dateFrom",
				"events.dateTill",
				"events.type",
				"events.place",
				"events.description",
				"events.meetingPlaceStart",
				"events.meetingPlaceEnd",
			])
			.leftJoinAndSelect("events.attendees", "attendees", "attendees.type = :type", { type: "leader" })
			.leftJoinAndSelect("attendees.member", "leaders")
			// row-level permission filter (see Permission.canWhere)
			.where(where);

		applySort(
			q,
			options,
			{ name: "events.name", dateFrom: "events.dateFrom", status: "events.status" },
			{ column: "events.dateFrom", order: "DESC" },
		);

		if (options.limit) {
			q.take(options.limit ?? 25);
		}

		if (options.offset) {
			q.skip(options.offset ?? 0);
		}

		if (options.year?.length) {
			q.andWhere(
				new Brackets((qb) => {
					for (const [index, year] of options.year!.entries()) {
						qb.orWhere(`events.date_till >= :yearStart${index} AND events.date_from <= :yearEnd${index}`, {
							[`yearStart${index}`]: `${year}-01-01`,
							[`yearEnd${index}`]: `${year}-12-31`,
						});
					}
				}),
			);
		}

		if (options.dateFrom) q.andWhere("events.dateTill >= :dateFrom", { dateFrom: options.dateFrom });
		if (options.dateTill) q.andWhere("events.dateFrom <= :dateTill", { dateTill: options.dateTill });

		if (options.status?.length) q.andWhere("events.status IN (:...statuses)", { statuses: options.status });

		if (options.search) q.andWhere("name ILIKE :search", { search: `%${options.search}%` });

		if (options.memberId) q.andWhere("attendees.member_id = :memberId", { memberId: options.memberId });

		if (options.noleader) q.andWhere("attendees.member_id IS NULL");

		if (options.deleted) q.withDeleted().andWhere("events.deleted_at IS NOT NULL");

		const events = await q.getMany();

		// populate `leaders` from the joined leader attendees so list consumers (cards, exports)
		// get the same shape as getEvent() — the @AfterLoad hook only covers already-loaded attendees
		for (const event of events) {
			event.leaders = (event.attendees ?? [])
				.filter((a) => a.member && a.type === EventAttendeeType.leader)
				.map((a) => a.member!);
		}

		return events;
	}

	/**
	 * Public program for the bosan.cz website: only published/cancelled events, with
	 * leader members and groups loaded. `dateFrom` defaults to a few days back so the
	 * currently-running events stay visible.
	 */
	async getPublicProgram(options: { dateFrom?: string; dateTill?: string; limit?: number } = {}) {
		const q = this.eventsRepository
			.createQueryBuilder("events")
			.select([
				"events.id",
				"events.name",
				"events.status",
				"events.dateFrom",
				"events.dateTill",
				"events.timeFrom",
				"events.timeTill",
				"events.type",
				"events.place",
				"events.description",
				"events.meetingPlaceStart",
				"events.meetingPlaceEnd",
				"events.leadersEvent",
				"events.hasRegistration",
			])
			.leftJoinAndSelect("events.groups", "groups")
			.leftJoinAndSelect("events.attendees", "attendees", "attendees.type = :type", { type: "leader" })
			.leftJoinAndSelect("attendees.member", "leaders")
			.where("events.status IN (:...statuses)", { statuses: [EventStates.public, EventStates.cancelled] })
			.andWhere("events.dateTill >= :dateFrom", { dateFrom: options.dateFrom ?? this.defaultProgramFrom() })
			.orderBy("events.dateFrom", "ASC")
			.addOrderBy("events.timeFrom", "ASC", "NULLS FIRST")
			.take(Math.min(options.limit ?? 100, 100));

		if (options.dateTill) q.andWhere("events.dateFrom <= :dateTill", { dateTill: options.dateTill });

		const events = await q.getMany();

		for (const event of events) {
			event.leaders = (event.attendees ?? [])
				.filter((a) => a.member && a.type === EventAttendeeType.leader)
				.map((a) => a.member!);
		}

		return events;
	}

	/** Three days back, so events that are currently under way are still shown. */
	private defaultProgramFrom() {
		const from = new Date();
		from.setDate(from.getDate() - 3);
		return from.toISOString().slice(0, 10);
	}

	async getEvent(id: number, options: { select?: FindOptionsSelect<Event>; leaders?: boolean } = {}) {
		const event = await this.eventsRepository.findOne({
			where: { id },
			select: options.select,
			relations: { album: true },
			withDeleted: true,
		});
		if (!event) return null;

		const leaderAttendees = await this.eventAttendeesRepository.find({
			where: { eventId: id, type: EventAttendeeType.leader },
			relations: { member: true },
			withDeleted: true,
		});
		event.attendees = leaderAttendees; // so isMyEvent(doc) works in canOrThrow & _links
		event.leaders = leaderAttendees.map((ea) => ea.member!);

		return event;
	}

	async createEvent(data: Partial<Event>) {
		return this.eventsRepository.save(data);
	}

	async updateEvent(id: number, data: Partial<Event>) {
		if (data.groupsIds) {
			data.groups = data.groupsIds.map((id) => ({ id }) as Group);
			delete data.groupsIds;
		}

		data.id = id;

		return this.eventsRepository.save(data);
	}

	async deleteEvent(id: number) {
		await this.eventsRepository.softRemove({ id });
	}

	async restoreEvent(id: number) {
		await this.eventsRepository.restore({ id });
	}

	async getEventsYears() {
		const q = this.eventsRepository
			.createQueryBuilder("events")
			.distinct(true)
			.select("EXTRACT('YEAR' FROM events.dateFrom) AS year")
			.withDeleted();

		return q.getRawMany<{ year: number }>().then((res) => res.map((r) => r.year));
	}

	async getEventsStatuses() {
		const q = this.eventsRepository
			.createQueryBuilder("events")
			.distinct(true)
			.select("events.status", "status")
			.withDeleted();

		return q.getRawMany<{ status: string }>().then((res) => res.map((r) => r.status));
	}

	async getEventAttendees(id: number) {
		const q = this.eventAttendeesRepository
			.createQueryBuilder("attendee")
			.where("attendee.event_id = :id", { id })
			.leftJoinAndSelect("attendee.member", "member")
			.leftJoinAndSelect("attendee.event", "event")
			// event.attendees is needed so isMyEvent(doc.event) works in the edit/delete permission checks and _links
			.leftJoinAndSelect("event.attendees", "leaders", "leaders.type = :type", { type: "leader" })
			.select(["attendee", "member", "event.id", "leaders"])
			.withDeleted();

		return q.getMany();
	}

	async getEventAttendee(eventId: number, memberId: number) {
		return this.eventAttendeesRepository.findOne({
			where: { eventId, memberId },
			// event.attendees is needed so isMyEvent(doc.event) works in the edit/delete permission checks
			relations: { member: true, event: { attendees: true } },
			withDeleted: true,
		});
	}

	async createEventAttendee(eventId: number, memberId: number, data: Omit<EventAttendee, "eventId" | "memberId">) {
		this.eventAttendeesRepository.save({ ...data, eventId, memberId });
	}

	async updateEventAttendee(eventId: number, memberId: number, data: Partial<EventAttendee>) {
		this.eventAttendeesRepository.update({ eventId, memberId }, data);
	}

	async deleteEventAttendee(eventId: number, memberId: number) {
		await this.eventAttendeesRepository.delete({ eventId, memberId });
	}

	async getEventExpenses(id: number) {
		const q = this.eventExpensesRepository
			.createQueryBuilder("expenses")
			.where("expenses.event_id = :id", { id })
			.leftJoinAndSelect("expenses.event", "events")
			.leftJoinAndSelect("events.attendees", "attendees", "attendees.type = :type", { type: "leader" })
			.select(["expenses", "events.id", "attendees"])
			.withDeleted();

		return q.getMany();
	}

	async getEventExpense(eventId: number, expenseId: number) {
		return this.eventExpensesRepository.findOne({
			where: { eventId, id: expenseId },
			relations: { event: { attendees: true } }, // so isMyEvent(doc.event) works in canOrThrow
			withDeleted: true,
		});
	}

	async createEventExpense(eventId: number, data: Partial<EventExpense>) {
		return this.eventExpensesRepository.save({ ...data, eventId });
	}

	async updateEventExpense(eventId: number, expenseId: number, data: Partial<EventExpense>) {
		this.eventExpensesRepository.update({ eventId, id: expenseId }, data);
	}

	async deleteEventExpense(eventId: number, expenseId: number) {
		await this.eventExpensesRepository.delete({ eventId, id: expenseId });
	}
}
