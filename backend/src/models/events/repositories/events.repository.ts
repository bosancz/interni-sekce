import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { PaginationOptions } from "src/models/helpers/pagination";
import { FindOptionsSelect, Repository } from "typeorm";
import { EventAttendee, EventAttendeeType } from "../entities/event-attendee.entity";
import { EventExpense } from "../entities/event-expense.entity";
import { Event } from "../entities/event.entity";

export interface GetEventsOptions extends PaginationOptions {
  year?: number;
  status?: string;
  search?: string;
  userId?: number;
  noleader?: boolean;
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
      .leftJoinAndSelect("attendees.member", "leaders")
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

    if (options.userId) {
      q.leftJoin("leaders.user", "users").andWhere("users.id = :userId", { userId: options.userId });
    }

    if (options.noleader) q.andWhere("leaders.id IS NULL");

    return q.getMany();
  }

  async getEvent(id: number, options: { select?: FindOptionsSelect<Event>; leaders?: boolean } = {}) {
    const event = await this.eventsRepository.findOne({ where: { id }, select: options.select });
    if (!event) return null;

    event.leaders = await this.getEventLeaders(id);

    return event;
  }

  async createEvent(data: Partial<Event>) {
    return this.eventsRepository.save(data);
  }

  async updateEvent(id: number, data: Partial<Event>) {
    return this.eventsRepository.update(id, data);
  }

  async deleteEvent(id: number) {
    await this.eventsRepository.softRemove({ id });
  }

  async getEventsYears() {
    const q = this.eventsRepository
      .createQueryBuilder("events")
      .distinct(true)
      .select("EXTRACT('YEAR' FROM events.dateFrom) AS year");

    return q.getRawMany<{ year: number }>().then((res) => res.map((r) => r.year));
  }

  async getEventLeaders(id: number) {
    return this.eventAttendeesRepository
      .find({
        where: { eventId: id, type: EventAttendeeType.leader },
        relations: { member: true },
      })
      .then((res) => res.map((ea) => ea.member!));
  }

  async getEventAttendees(id: number) {
    return this.eventAttendeesRepository.find({ where: { eventId: id }, relations: { member: true, event: true } });
  }

  async getEventAttendee(eventId: number, memberId: number) {
    return this.eventAttendeesRepository.findOne({
      where: { eventId, memberId },
      relations: { member: true, event: true },
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
    return this.eventExpensesRepository.find({ where: { eventId: id } });
  }

  async getEventExpense(eventId: number, id: string) {
    return this.eventExpensesRepository.findOne({
      where: { eventId, id },
    });
  }

  async createEventExpense(eventId: number, expenseId: string, data: Partial<EventExpense>) {
    this.eventExpensesRepository.save({ ...data, eventId, id: expenseId });
  }

  async updateEventExpense(eventId: number, expenseId: string, data: Partial<EventExpense>) {
    this.eventExpensesRepository.update({ eventId, id: expenseId }, data);
  }

  async deleteEventExpense(eventId: number, expenseId: string) {
    await this.eventExpensesRepository.delete({ eventId, id: expenseId });
  }
}
