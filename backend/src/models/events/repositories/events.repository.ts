import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { PaginationOptions } from "src/helpers/pagination";
import { Group } from "src/models/members/entities/group.entity";
import { FindOptionsSelect, Repository } from "typeorm";
import { EventAttendee, EventAttendeeType } from "../entities/event-attendee.entity";
import { EventExpense } from "../entities/event-expense.entity";
import { Event } from "../entities/event.entity";

export interface GetEventsOptions extends PaginationOptions {
	year?: number;
	status?: string;
	search?: string;
	memberId?: number;
	noleader?: boolean;
	deleted?: boolean;
}

@Injectable()
export class EventsRepository {
	constructor(
		@InjectRepository(Event) private eventsRepository: Repository<Event>,
		@InjectRepository(EventAttendee) private eventAttendeesRepository: Repository<EventAttendee>,
		@InjectRepository(EventExpense) private eventExpensesRepository: Repository<EventExpense>,
	) {}

	async getEvents(options: GetEventsOptions = {}) {
		const q = this.eventsRepository
			.createQueryBuilder("events")
			.select(["events.id", "events.name", "events.status", "events.dateFrom", "events.dateTill", "events.type"])
			.leftJoinAndSelect("events.attendees", "attendees", "attendees.type = :type", { type: "leader" })
			.orderBy("events.dateFrom", "DESC")
			.take(options.limit ?? 25)
			.skip(options.offset ?? 0);

		if (options.year) {
			q.andWhere("date_till >= :yearStart AND date_from <= :yearEnd", {
				yearStart: `${options.year}-01-01`,
				yearEnd: `${options.year}-12-31`,
			});
		}

		if (options.status) q.andWhere("status = :status", { status: options.status });

		if (options.search) q.andWhere("name ILIKE :search", { search: `%${options.search}%` });

		if (options.memberId) q.andWhere("attendees.member_id = :memberId", { memberId: options.memberId });

		if (options.noleader) q.andWhere("attendees.member_id IS NULL");

		if (options.deleted) q.withDeleted().andWhere("events.deleted_at IS NOT NULL");

		return q.getMany();
	}

	async getEvent(id: number, options: { select?: FindOptionsSelect<Event>; leaders?: boolean } = {}) {
		const event = await this.eventsRepository.findOne({ where: { id }, select: options.select, withDeleted: true });
		if (!event) return null;

		event.leaders = await this.getEventLeaders(id);

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

	async getEventLeaders(id: number) {
		return this.eventAttendeesRepository
			.find({
				where: { eventId: id, type: EventAttendeeType.leader },
				relations: { member: true },
				withDeleted: true,
			})
			.then((res) => res.map((ea) => ea.member!));
	}

	async getEventAttendees(id: number) {
		return this.eventAttendeesRepository.find({
			where: { eventId: id },
			relations: { member: true, event: true },
			withDeleted: true,
		});
	}

	async getEventAttendee(eventId: number, memberId: number) {
		return this.eventAttendeesRepository.findOne({
			where: { eventId, memberId },
			relations: { member: true, event: true },
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

	//
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

	async getEventExpense(eventId: number, id: number) {
		return this.eventExpensesRepository.findOne({
			where: { eventId, id },
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
