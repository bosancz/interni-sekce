import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { FindOptionsSelect, Repository } from "typeorm";
import { EventAttendee, EventAttendeeType } from "../entities/event-attendee.entity";
import { EventExpense } from "../entities/event-expense.entity";
import { Event } from "../entities/event.entity";

@Injectable()
export class EventsService {
  constructor(
    @InjectRepository(Event) private eventsRepository: Repository<Event>,
    @InjectRepository(EventAttendee) private eventAttendeesRepository: Repository<EventAttendee>,
    @InjectRepository(EventExpense) private eventExpensesRepository: Repository<EventExpense>,
  ) {}

  async getEvents(options: { select?: (keyof Event)[]; leaders?: boolean } = {}) {
    let query = this.eventsRepository.createQueryBuilder("events");

    if (options.select) {
      query.select(options.select.map((f) => `events.${f}`));
    }

    if (options.leaders) {
      query
        .leftJoinAndMapMany("events.leadersAttendees", "events.attendees", "attendees", "attendees.type = 'leader'")
        .leftJoinAndMapOne("attendees.member", "attendees.member", "leaders");
    }

    const events = await (<Promise<(Event & { leadersAttendees?: EventAttendee[] })[]>>query.getMany());

    if (options.leaders) {
      events.forEach((e) => {
        e.leaders = e.leadersAttendees?.map((ea) => ea.member!);
        delete e.leadersAttendees;
      });
    }
    return <Event[]>events;
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
